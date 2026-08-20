package com.hrforhealth.myhrfh;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

public class ManagementCommandTest {
    @Test
    public void parsesOnlyExactAllowedCommandShape() {
        ManagementCommand command = ManagementCommand.parse(
                "{\"type\":\"hrfh-management\",\"version\":1,\"requestId\":\"req_1\",\"action\":\"restore-shortcut\"}"
        );
        assertEquals("req_1", command.getRequestId());
        assertEquals("restore-shortcut", command.getAction());
    }

    @Test
    public void rejectsMalformedOversizedOrExecutableInputs() {
        String[] invalid = {
                "not-json",
                "{}",
                "{\"type\":\"other\",\"version\":1,\"requestId\":\"req1\",\"action\":\"uninstall\"}",
                "{\"type\":\"hrfh-management\",\"version\":2,\"requestId\":\"req1\",\"action\":\"uninstall\"}",
                "{\"type\":\"hrfh-management\",\"version\":1,\"requestId\":\"bad id\",\"action\":\"uninstall\"}",
                "{\"type\":\"hrfh-management\",\"version\":1,\"requestId\":\"req1\",\"action\":\"shell\"}",
                "{\"type\":\"hrfh-management\",\"version\":1,\"requestId\":\"req1\",\"action\":\"uninstall\",\"url\":\"https://example.com\"}"
        };
        for (String value : invalid) {
            assertThrows(IllegalArgumentException.class, () -> ManagementCommand.parse(value));
        }
        assertThrows(
                IllegalArgumentException.class,
                () -> ManagementCommand.parse("x".repeat(ManagementCommand.MAX_MESSAGE_LENGTH + 1))
        );
    }
}
