import { useState } from "react";

import { type TranslationFn } from "../../types";
import { readDiscardGoesHome, writeDiscardGoesHome } from "../../lib/discardPreference";
import { SectionLabel, SettingsToggleRow } from "./shared";
import { Trash } from "reicon-react";

export interface DiscardPreferenceSectionProps {
  t: TranslationFn;
}

export default function DiscardPreferenceSection({ t }: DiscardPreferenceSectionProps) {
  const [enabled, setEnabled] = useState(readDiscardGoesHome);

  return (
    <>
      <SectionLabel label={t("discardMatchSection")} icon={<Trash size={14} />} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <SettingsToggleRow
          title={t("discardGoesHome")}
          desc={t("discardGoesHomeDesc")}
          enabled={enabled}
          onToggle={(value) => {
            setEnabled(value);
            writeDiscardGoesHome(value);
          }}
          testId="discard-preference-row"
          switchTestId="discard-preference-toggle"
        />
      </div>
    </>
  );
}
