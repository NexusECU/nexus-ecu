import type {
  RomImageInfo,
} from "../rom/romTypes";

import type {
  TransportProviderId,
} from "./transportTypes";

import type {
  EcuBackupRecord,
} from "./ecuReadTypes";

async function sha256Hex(
  bytes: Uint8Array,
): Promise<string> {
  const input =
    bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset +
        bytes.byteLength,
    ) as ArrayBuffer;

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      input,
    );

  return Array.from(
    new Uint8Array(digest),
  )
    .map(
      (value) =>
        value.toString(16).padStart(2, "0"),
    )
    .join("");
}

export async function createBackupFromRomImage(
  image: RomImageInfo,
  providerId: TransportProviderId,
  ecuIdentity: string,
  protocol: string,
): Promise<EcuBackupRecord> {
  const bytes =
    new Uint8Array(
      image.bytes,
    );

  const sha256 =
    await sha256Hex(
      bytes,
    );

  return {
    id:
      `backup-${Date.now()}`,
    createdAt:
      new Date().toISOString(),
    providerId,
    source:
      "offline-image",
    fileName:
      image.fileName.replace(
        /(\.[^.]+)?$/,
        "-backup$1",
      ),
    sizeBytes:
      bytes.length,
    sha256,
    verified:
      sha256 ===
      image.sha256,
    ecuIdentity,
    protocol,
    bytes,
  };
}

export async function verifyBackup(
  backup: EcuBackupRecord,
): Promise<boolean> {
  return (
    await sha256Hex(
      backup.bytes,
    )
  ) === backup.sha256;
}

export function exportBackup(
  backup: EcuBackupRecord,
): void {
  const blob =
    new Blob(
      [new Uint8Array(backup.bytes)],
      {
        type:
          "application/octet-stream",
      },
    );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href =
    url;
  anchor.download =
    backup.fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}
