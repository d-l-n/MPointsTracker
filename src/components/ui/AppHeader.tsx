import { memo, type ReactNode } from "react";

interface AppHeaderProps {
  title?: ReactNode;
  titleClassName?: string;
  leading?: ReactNode;
  main?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  mainClassName?: string;
  testId?: string;
  hidden?: boolean;
}

function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const AppHeader = memo(function AppHeader({
  title,
  titleClassName = "big-title app-layout-page-title",
  leading,
  main,
  actions,
  children,
  className,
  mainClassName = "app-layout-header-main",
  testId,
  hidden = false,
}: AppHeaderProps) {
  return (
    <header
      className={joinClasses("hdr page-header-compact app-layout-header", hidden && "chrome--hidden", className)}
      data-app-header="pill"
      data-testid={testId}
    >
      <div className="hdr-inner">
        {children || (
          <>
            {leading}
            <div className={mainClassName}>
              {main || <h1 className={titleClassName}>{title}</h1>}
            </div>
            {actions ? <div className="app-layout-header-actions">{actions}</div> : null}
          </>
        )}
      </div>
    </header>
  );
});

export default AppHeader;
