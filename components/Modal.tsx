import Button from "./Button"
import clsx from "clsx"
import { ReactNode } from "react"
import * as Dialog from "@radix-ui/react-dialog"

interface ModalProps {
  isOpen: boolean
  alert?: boolean
  icon: ReactNode
  title: string
  onOpenChange: (open: boolean) => void
  children?: ReactNode
}

const Modal = ({
  isOpen,
  alert,
  icon,
  title,
  onOpenChange,
  children
}: ModalProps) => (
  <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/5 flex justify-center items-center z-[100000] animate-fade-in">
        <Dialog.Content className="bg-bg shadow-[0_0_10px_rgba(0_0_0/75%)] focus:outline-none text-center rounded overflow-hidden">
          <div
            className={clsx(
              "py-4 px-12",
              alert ? "bg-modal-alert" : "bg-modal-success"
            )}
          >
            <Dialog.Title className="font-medium flex flex-col items-center gap-0.5">
              <div className="text-xs">{icon}</div>
              <div className="text-lg leading-6">{title}</div>
            </Dialog.Title>
            <div className="text-xs">{children}</div>
          </div>
          <div className="max-w-[4rem] my-2 mx-auto flex flex-row justify-end text-[0.6rem]">
            <Button onClick={() => onOpenChange(false)}>OK</Button>
          </div>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  </Dialog.Root>
)

export default Modal
