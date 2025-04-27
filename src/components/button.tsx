import React from "react"
import Stack from "@mui/material/Stack"

/**
 * Props for the GreenButton component
 */
interface GreenButtonProps {
  /** The text to display on the button */
  text: string
  /** The link to navigate to when the button is clicked */
  link: string
  /** Optional onClick handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  /** Optional additional className */
  className?: string
  /** Optional disabled state */
  disabled?: boolean
}

/**
 * Renders a green button component with the provided properties
 */
export default function GreenButton({
  text,
  link,
  onClick,
  className = "",
  disabled = false
}: GreenButtonProps): React.ReactElement {
  return (
    <Stack spacing={2} direction="row">
      <button
        className={`px-4 py-2 rounded-md border border-black bg-green-500 text-white text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${className}`}
        onClick={onClick}
        disabled={disabled}
        data-href={link} // Using data attribute instead of src which is not valid for button
      >
        {text}
      </button>
    </Stack>
  )
}
