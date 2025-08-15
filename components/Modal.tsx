import * as Dialog from "@radix-ui/react-dialog"
import Button from "./Button"
import clsx from "clsx"
import { ReactNode } from "react"

interface ModalProps {
  isOpen: boolean
  type: "success" | "alert" | "warning"
  icon: ReactNode
  title: string
  onOpenChange: (open: boolean) => void
  children?: ReactNode
}

const Modal = ({
  isOpen,
  type,
  icon,
  title,
  onOpenChange,
  children,
}: ModalProps) => (
  <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/5 flex justify-center items-center z-100000 animate-fade-in">
        <Dialog.Content className="bg-bg shadow-[0_0_10px_rgba(0_0_0/75%)] focus:outline-hidden text-center rounded overflow-hidden">
          <div
            className={clsx(
              "py-4 px-12",
              type === "alert"
                ? "bg-modal-alert"
                : type === "warning"
                  ? "bg-modal-warning"
                  : "bg-modal-success",
            )}
          >
            <Dialog.Title className="font-medium flex flex-col items-center gap-0.5">
              <div className="text-xs">{icon}</div>
              <div className="text-lg leading-6">{title}</div>
            </Dialog.Title>
            <div className="text-xs">{children}</div>
          </div>
          <div className="max-w-16 my-2 mx-auto flex flex-row justify-end text-[0.6rem]">
            <Button onClick={() => onOpenChange(false)}>OK</Button>
          </div>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  </Dialog.Root>
)

export default Modal
