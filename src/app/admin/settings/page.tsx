"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const { locale, t } = useI18n();
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("settingsTitle")}</h1>
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t("displayLanguage")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <LanguageSwitcher />
          <span className="text-sm text-muted-foreground">
            {t("currentLanguage")}: {locale}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
