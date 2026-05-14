import { BrandLink } from "./BrandLink";
import { MarketingLinks } from "./MarketingLinks";

export function MarketingNav() {
  return (
    <header className="marketing-nav">
      <div className="container marketing-nav-inner">
        <BrandLink />
        <MarketingLinks />
      </div>
    </header>
  );
}
