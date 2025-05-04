"use client"

import { Eye, EyeOff } from "lucide-react"
import { useState, forwardRef, InputHTMLAttributes } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, name, ...props }, ref) => {
    const [show, setShow] = useState(false)

    return (
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor={name}>{label}</Label>
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            id={name}
            name={name}
            className="pl-10 pr-2" // مساحة للزر على اليسار بدلاً من اليمين
            ref={ref}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShow((prev) => !prev)}
          >
            {show ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only">
              {show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            </span>
          </Button>
        </div>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"
