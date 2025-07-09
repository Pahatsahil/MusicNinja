export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export interface ToastState {
  queue: Toast[];
}
