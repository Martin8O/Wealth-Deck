import * as React from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/context";

export function AboutButton() {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          title={t("about.title")}
        >
          <Info className="size-4" />
          <span className="hidden sm:inline">{t("about.title")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("about.title")}</DialogTitle>
          <DialogDescription>{t("about.tagline")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm leading-relaxed text-foreground">
          <section>
            <h3 className="mb-1.5 text-sm font-semibold text-foreground">
              {t("about.what.title")}
            </h3>
            <p className="text-muted-foreground">{t("about.what.body")}</p>
          </section>

          <section>
            <h3 className="mb-1.5 text-sm font-semibold text-foreground">
              {t("about.privacy.title")}
            </h3>
            <p className="text-muted-foreground">{t("about.privacy.body")}</p>
          </section>

          <section>
            <h3 className="mb-1.5 text-sm font-semibold text-foreground">
              {t("about.security.title")}
            </h3>
            <p className="text-muted-foreground">{t("about.security.body")}</p>
          </section>

          <section className="rounded-md border border-border bg-muted/40 p-3">
            <h3 className="mb-1.5 text-sm font-semibold text-foreground">
              {t("about.disclaimer.title")}
            </h3>
            <p className="text-muted-foreground">{t("about.disclaimer.body")}</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
