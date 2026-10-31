import { Eye, EyeOff } from "lucide-react"

interface PasswordShowHideProps {
  passwordVisible: boolean
  setPasswordVisible: (
    visible: boolean | ((prevState: boolean) => boolean)
  ) => void
}

export const PasswordShowHide = ({
  passwordVisible,
  setPasswordVisible,
}: PasswordShowHideProps) => {
  return (
    <button
      className="absolute top-1/2 right-1 -translate-y-1/2 border-0 pr-2"
      type="button"
      aria-label={passwordVisible ? "Hide password" : "Show password"}
      aria-pressed={passwordVisible}
      onClick={() => setPasswordVisible((visible) => !visible)}
    >
      {passwordVisible ? (
        <EyeOff className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Eye className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  )
}
