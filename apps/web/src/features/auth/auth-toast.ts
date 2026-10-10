import toast from "react-hot-toast";

export function authToastSuccess(message: string) {
  toast.success(message, { id: "auth-success" });
}

export function authToastError(message: string) {
  toast.error(message, { id: "auth-error" });
}
