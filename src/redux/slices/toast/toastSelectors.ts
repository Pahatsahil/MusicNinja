import { RootState } from "redux/store/store";


export const selectToasts = (state: RootState) => state.toast.queue;
