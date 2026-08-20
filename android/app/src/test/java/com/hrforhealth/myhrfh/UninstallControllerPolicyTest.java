package com.hrforhealth.myhrfh;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

public class UninstallControllerPolicyTest {
    @Test
    public void uninstallUriTargetsOnlySuppliedOwnPackageIdentity() {
        assertEquals(
                "package:com.hrforhealth.myhrfh.staging",
                UninstallController.buildPackageUri("com.hrforhealth.myhrfh.staging")
        );
    }

    @Test
    public void invalidPackageIdentityIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> UninstallController.buildPackageUri(""));
        assertThrows(IllegalArgumentException.class, () -> UninstallController.buildPackageUri("single"));
        assertThrows(IllegalArgumentException.class, () -> UninstallController.buildPackageUri("com.example/bad"));
    }
}
