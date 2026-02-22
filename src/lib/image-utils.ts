// 이미지 첨부 관련 유틸리티

export const MAX_IMAGES_PER_TODO = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export interface TodoImage {
  id: string;
  url: string;
  filename: string;
  size?: number;
  order?: number;
}

export interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploaded: boolean;
  blobUrl?: string;
  error?: string;
}

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "지원하지 않는 파일 형식입니다. (jpeg, png, gif, webp만 가능)";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "파일 크기가 5MB를 초과합니다.";
  }
  return null;
}

export async function compressImage(file: File): Promise<File> {
  // GIF는 압축하지 않음 (애니메이션 보존)
  if (file.type === "image/gif") return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const MAX_DIM = 1920;
      let { width, height } = img;

      // 이미 충분히 작으면 그대로 반환
      if (width <= MAX_DIM && height <= MAX_DIM && file.size <= 1024 * 1024) {
        resolve(file);
        return;
      }

      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressed = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressed);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export async function uploadImage(file: File): Promise<{ url: string; filename: string; size: number }> {
  const compressed = await compressImage(file);

  const formData = new FormData();
  formData.append("file", compressed);

  const response = await fetch("/api/images/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "업로드에 실패했습니다.");
  }

  return response.json();
}

export function getImagesFromClipboard(e: ClipboardEvent): File[] {
  const items = e.clipboardData?.items;
  if (!items) return [];

  const files: File[] = [];
  for (const item of Array.from(items)) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }
  return files;
}

export function getImagesFromDrop(e: DragEvent): File[] {
  const files: File[] = [];
  if (e.dataTransfer?.files) {
    for (const file of Array.from(e.dataTransfer.files)) {
      if (file.type.startsWith("image/")) {
        files.push(file);
      }
    }
  }
  return files;
}
