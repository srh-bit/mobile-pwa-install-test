package com.hrforhealth.myhrfh;

import org.junit.Test;

import java.util.List;

import static org.junit.Assert.assertEquals;

public class ShortcutControllerPolicyTest {
    @Test
    public void unsupportedLauncherNeverRequestsPin() {
        assertEquals("unsupported", ShortcutController.decide(false, List.of()));
    }

    @Test
    public void stablePinnedShortcutIsNotDuplicated() {
        assertEquals(
                "already-present",
                ShortcutController.decide(true, List.of("other", ShortcutController.SHORTCUT_ID))
        );
    }

    @Test
    public void supportedAbsentShortcutMayRequestPin() {
        assertEquals("requested", ShortcutController.decide(true, List.of("other")));
    }
}
