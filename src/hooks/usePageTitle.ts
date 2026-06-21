import { useEffect } from "react";

export function usePageTitle(title: string | null) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | MPoints Tracker`;
    } else {
      document.title = "MPoints Tracker";
    }
  }, [title]);
}
