import React from "react"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import styled, { css } from "styled-components"

type ButtonVariant = "contained" | "outlined" | "text"
type ButtonSize = "small" | "medium" | "large"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  startIcon?: ReactNode
  endIcon?: ReactNode
  fullWidth?: boolean
  as?: React.ElementType
  to?: string
}

const ButtonBase = css<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-primary);
  font-weight: 500;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  cursor: pointer;
  outline: none;
  border: none;
  
  ${(props) =>
    props.fullWidth &&
    css`
    width: 100%;
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const sizeStyles = {
  small: css`
    padding: 0.4rem 0.75rem;
    font-size: 0.875rem;
  `,
  medium: css`
    padding: 0.6rem 1.25rem;
    font-size: 1rem;
  `,
  large: css`
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
  `,
}

const variantStyles = {
  contained: css`
    background-color: var(--color-primary);
    color: white;
    
    &:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
      transform: translateY(-1px);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  `,
  outlined: css`
    background-color: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    
    &:hover:not(:disabled) {
      background-color: rgba(var(--color-primary-rgb), 0.05);
    }
  `,
  text: css`
    background-color: transparent;
    color: var(--color-primary);
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    
    &:hover:not(:disabled) {
      background-color: rgba(var(--color-primary-rgb), 0.05);
    }
  `,
}

const StyledButton = styled.button<ButtonProps>`
  ${ButtonBase}
  ${(props) => sizeStyles[props.size || "medium"]}
  ${(props) => variantStyles[props.variant || "contained"]}
`

const Button: React.FC<ButtonProps> = ({
  variant = "contained",
  size = "medium",
  startIcon,
  endIcon,
  children,
  fullWidth = false,
  as,
  ...props
}) => {
  return (
    <StyledButton variant={variant} size={size} fullWidth={fullWidth} as={as} {...props}>
      {startIcon && <span className="button-start-icon">{startIcon}</span>}
      {children}
      {endIcon && <span className="button-end-icon">{endIcon}</span>}
    </StyledButton>
  )
}

export default Button
