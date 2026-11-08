/**
 * Starts a browser-compatible file delivery.
 * On iOS/iPadOS, prefer the native share sheet so users can choose "Save to Files".
 * On other browsers, use an object URL and keep it alive long enough for the download
 * manager to consume it (immediate revocation can silently cancel downloads).
 */
export async function deliverFile(blob: Blob, fileName: string): Promise<'shared' | 'opened' | 'downloaded'> {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (typeof File !== 'undefined' && nav.share && nav.canShare) {
    const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
    try {
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: fileName });
        return 'shared';
      }
    } catch (error) {
      // User cancellation is not a download failure and must not trigger a second download.
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      // Continue to the browser download fallback for unsupported share implementations.
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);

  const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isAppleMobile) {
    // iOS Safari may ignore the download attribute for Blob URLs; open the file so
    // the user can use Share -> Save to Files instead of receiving a false success.
    const openedWindow = window.open(objectUrl, '_blank');
    if (openedWindow) {
      try { openedWindow.opener = null; } catch { /* no-op */ }
    } else {
      anchor.click();
    }
  } else {
    anchor.click();
  }

  // Do not revoke immediately: Safari and some mobile browsers read the Blob lazily.
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
    anchor.remove();
  }, 60_000);

  return isAppleMobile ? 'opened' : 'downloaded';
}
