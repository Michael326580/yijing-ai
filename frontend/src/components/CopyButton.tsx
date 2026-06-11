import { Copy } from "lucide-react";
import { useState } from "react";
import { PrimaryButton } from "./PrimaryButton";

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  onCopied?: () => void;
}

export function CopyButton({ text, label = "复制", variant = "secondary", onCopied }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    onCopied?.();
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <PrimaryButton type="button" variant={variant} onClick={handleCopy}>
      <Copy size={16} />
      {copied ? "已复制" : label}
    </PrimaryButton>
  );
}
