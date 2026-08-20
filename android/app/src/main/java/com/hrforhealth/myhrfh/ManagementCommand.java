package com.hrforhealth.myhrfh;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;

import java.util.Set;
import java.util.regex.Pattern;

final class ManagementCommand {
    static final int MAX_MESSAGE_LENGTH = 2048;
    static final String TYPE = "hrfh-management";
    static final int VERSION = 1;

    private static final Set<String> ALLOWED_FIELDS = Set.of("type", "version", "requestId", "action");
    private static final Set<String> ALLOWED_ACTIONS = Set.of("restore-shortcut", "uninstall");
    private static final Pattern REQUEST_ID = Pattern.compile("[A-Za-z0-9_-]{1,64}");

    private final String requestId;
    private final String action;

    private ManagementCommand(String requestId, String action) {
        this.requestId = requestId;
        this.action = action;
    }

    static ManagementCommand parse(String message) {
        if (message == null || message.isEmpty() || message.length() > MAX_MESSAGE_LENGTH) {
            throw new IllegalArgumentException("Invalid message length");
        }

        final JsonElement root;
        try {
            root = JsonParser.parseString(message);
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("Malformed JSON", exception);
        }

        if (!root.isJsonObject()) {
            throw new IllegalArgumentException("Message must be an object");
        }

        JsonObject object = root.getAsJsonObject();
        if (!object.keySet().equals(ALLOWED_FIELDS)) {
            throw new IllegalArgumentException("Unexpected or missing fields");
        }

        if (!isString(object.get("type")) || !TYPE.equals(object.get("type").getAsString())) {
            throw new IllegalArgumentException("Unsupported message type");
        }

        JsonElement version = object.get("version");
        if (version == null || !version.isJsonPrimitive() || !version.getAsJsonPrimitive().isNumber()
                || version.getAsInt() != VERSION) {
            throw new IllegalArgumentException("Unsupported protocol version");
        }

        if (!isString(object.get("requestId"))) {
            throw new IllegalArgumentException("Invalid request id");
        }
        String requestId = object.get("requestId").getAsString();
        if (!REQUEST_ID.matcher(requestId).matches()) {
            throw new IllegalArgumentException("Invalid request id");
        }

        if (!isString(object.get("action"))) {
            throw new IllegalArgumentException("Invalid action");
        }
        String action = object.get("action").getAsString();
        if (!ALLOWED_ACTIONS.contains(action)) {
            throw new IllegalArgumentException("Unsupported action");
        }

        return new ManagementCommand(requestId, action);
    }

    private static boolean isString(JsonElement element) {
        if (element == null || !element.isJsonPrimitive()) {
            return false;
        }
        JsonPrimitive primitive = element.getAsJsonPrimitive();
        return primitive.isString();
    }

    String getRequestId() {
        return requestId;
    }

    String getAction() {
        return action;
    }
}
