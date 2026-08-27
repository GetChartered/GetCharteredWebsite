"use client";

import { useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BrandedLoader } from "@/components/BrandedLoader";
import { resizeImageToSquare, ImageResizeError } from "@/lib/image/resizeImageToSquare";

type UploadStatus = "idle" | "uploading" | "error";

interface AvatarUploadProps {
  /** Custom avatar already on file (GET /profile's photoUrl), if any. */
  initialPhotoUrl?: string;
  /** Auth0 IdP picture — shown when there's no custom photo yet. */
  fallbackPictureUrl?: string;
  displayName: string;
  email: string;
  initials: string;
}

/**
 * Owns the whole sidebar identity cluster (avatar + name/email), not just
 * the circle, because the upload/retry state needs to live next to the text
 * it affects. Click or hover the avatar to reveal a camera-icon overlay;
 * selecting a file resizes it client-side (lib/image/resizeImageToSquare.ts)
 * before it ever leaves the browser, then POSTs to /api/user/photo. That
 * backend route isn't deployed yet (see backend-reference/updateUserPhoto.js)
 * — this component treats that exactly like any other upload failure: a
 * toast plus a persistent inline "Retry" affordance, never a crash.
 *
 * Sized via CSS (.account-sidebar-avatar), not an inline style, specifically
 * so the mobile breakpoint can shrink it back down — see the media query
 * next to that class in globals.css.
 */
export function AvatarUpload({ initialPhotoUrl, fallbackPictureUrl, displayName, email, initials }: AvatarUploadProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const displayedPhoto = previewUrl ?? photoUrl ?? fallbackPictureUrl;

  const upload = async (imageBase64: string) => {
    setStatus("uploading");
    setPendingImage(imageBase64);

    try {
      const res = await fetch("/api/user/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok || typeof data.photoUrl !== "string") {
        throw new Error(typeof data?.error === "string" ? data.error : "Upload failed");
      }

      setPhotoUrl(data.photoUrl as string);
      setPreviewUrl(null);
      setPendingImage(null);
      setStatus("idle");
      showToast("Profile photo updated", "success");
    } catch (error) {
      setStatus("error");
      showToast(error instanceof Error ? error.message : "Couldn't upload photo", "error");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked later if needed
    if (!file) return;

    try {
      const resized = await resizeImageToSquare(file);
      setPreviewUrl(resized);
      await upload(resized);
    } catch (error) {
      setStatus("error");
      showToast(
        error instanceof ImageResizeError ? error.message : "Couldn't process that image",
        "error"
      );
    }
  };

  const handleRetry = () => {
    if (pendingImage) void upload(pendingImage);
  };

  return (
    <div className="account-sidebar-identity">
      <div className="avatar-upload account-sidebar-avatar">
        <button
          type="button"
          className="avatar-upload-trigger"
          onClick={() => fileInputRef.current?.click()}
          disabled={status === "uploading"}
          aria-label="Change profile photo"
        >
          {displayedPhoto ? (
            <img src={displayedPhoto} alt="" className="avatar-upload-image" />
          ) : (
            <span className="avatar-upload-initials">{initials}</span>
          )}
          <span className={`avatar-upload-overlay${status === "uploading" ? " is-active" : ""}`}>
            {status === "uploading" ? <BrandedLoader size={28} /> : <Camera size={22} color="#fff" />}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => void handleFileChange(e)}
          style={{ display: "none" }}
        />
      </div>

      <div style={{ minWidth: 0 }}>
        {displayName && (
          <p className="account-sidebar-name" title={displayName}>
            {displayName}
          </p>
        )}
        <p className="account-sidebar-email" title={email}>
          {email}
        </p>
        {status === "error" && (
          <button type="button" className="avatar-upload-retry" onClick={handleRetry}>
            <RotateCcw size={11} />
            Photo upload failed — Retry
          </button>
        )}
      </div>
    </div>
  );
}
