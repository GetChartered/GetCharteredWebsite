"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { PracticeToolModal } from "@/components/practice/PracticeToolModal";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";

// Danger Zone's entry point into account deletion, reusing
// DeleteAccountForm's existing type-to-confirm safeguard (see
// DeleteAccountForm's `onCancel` prop) inside a modal instead of navigating
// away to the standalone /account/delete page — the confirmation itself
// isn't new, it's the same safeguard, just reached without a full page nav.
export function DeleteAccountModal({ email }: { email: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setIsOpen(true)}>
        Delete Account
      </Button>

      {isOpen && (
        <PracticeToolModal title="Delete your account" onClose={() => setIsOpen(false)} maxWidth={480}>
          <DeleteAccountForm email={email} onCancel={() => setIsOpen(false)} />
        </PracticeToolModal>
      )}
    </>
  );
}
