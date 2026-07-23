const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent) => {
  const { id, text } = event.data;
  try {
    const data = JSON.parse(text);
    ctx.postMessage({ id, status: 'success', data });
  } catch (error: any) {
    ctx.postMessage({ id, status: 'error', error: error?.message || 'Unknown parsing error' });
  }
};

export {};
