import html2canvas from 'html2canvas';

async function renderCard(element: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    backgroundColor: '#0f1729',
    scale: 2,
  });
}

export async function exportCardAsPNG(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await renderCard(element);
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function copyCardToClipboard(
  element: HTMLElement,
): Promise<void> {
  const canvas = await renderCard(element);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Failed to create blob'))), 'image/png');
  });
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob }),
  ]);
}
