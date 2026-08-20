package com.hrforhealth.myhrfh;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class NativeManagementBridgeTest {
    @Test
    public void sameOriginNormalizesCaseAndDefaultHttpsPortOnly() {
        assertTrue(NativeManagementBridge.sameOrigin("https://myhrfh.com", "https://MYHRFH.com:443/portal"));
        assertFalse(NativeManagementBridge.sameOrigin("https://myhrfh.com", "http://myhrfh.com"));
        assertFalse(NativeManagementBridge.sameOrigin("https://myhrfh.com", "https://other.example"));
        assertFalse(NativeManagementBridge.sameOrigin("https://myhrfh.com", "https://myhrfh.com:8443"));
    }

    @Test
    public void handshakeAdvertisesExactlyTwoManagementCapabilities() {
        JsonObject object = JsonParser.parseString(NativeManagementBridge.buildHandshakeJson()).getAsJsonObject();
        assertEquals("hrfh-native", object.get("type").getAsString());
        assertEquals(1, object.get("version").getAsInt());
        assertEquals(3, object.size());
        JsonArray capabilities = object.getAsJsonArray("capabilities");
        assertEquals(2, capabilities.size());
        assertEquals("restore-shortcut", capabilities.get(0).getAsString());
        assertEquals("uninstall", capabilities.get(1).getAsString());
    }

    @Test
    public void resultContainsOnlyBoundedProtocolFields() {
        JsonObject object = JsonParser.parseString(
                NativeManagementBridge.buildResultJson("req_1", "requested")
        ).getAsJsonObject();
        assertEquals(4, object.size());
        assertEquals("hrfh-management-result", object.get("type").getAsString());
        assertEquals(1, object.get("version").getAsInt());
        assertEquals("req_1", object.get("requestId").getAsString());
        assertEquals("requested", object.get("status").getAsString());
    }
}
