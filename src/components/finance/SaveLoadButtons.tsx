import * as React from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { snapshotAll, restoreAll } from "@/hooks/usePersistentState";
import { useI18n } from "@/lib/i18n/context";

export function SaveLoadButtons() {
  const { t } = useI18n();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const onExport = () => {
    const data = {
      app: "Wealth Deck",
      version: 1,
      exportedAt: new Date().toISOString(),
      state: snapshotAll(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `wealth-deck-save-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const state =
          parsed && typeof parsed === "object" && parsed.state
            ? (parsed.state as Record<string, unknown>)
            : (parsed as Record<string, unknown>);
        restoreAll(state);
      } catch {
        alert(t("save.import.error"));
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        className="h-9 gap-1.5"
        title={t("save.export")}
      >
        <Download className="size-4" />
        <span className="hidden sm:inline">{t("save.export")}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        className="h-9 gap-1.5"
        title={t("save.import")}
      >
        <Upload className="size-4" />
        <span className="hidden sm:inline">{t("save.import")}</span>
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImport}
      />
    </>
  );
}
