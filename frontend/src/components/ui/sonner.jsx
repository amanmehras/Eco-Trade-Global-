import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-[#2A5934] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700",
          success: "group-[.toast]:bg-gray-50 group-[.toast]:border-gray-200",
          error: "group-[.toast]:bg-red-50 group-[.toast]:border-red-200",
          info: "group-[.toast]:bg-gray-50 group-[.toast]:border-gray-200",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }
