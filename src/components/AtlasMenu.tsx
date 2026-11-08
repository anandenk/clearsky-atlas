import { BrandMark, Icon } from "./Icon";
import "../styles/atlas-menu.css";

type AtlasMenuProps = {
  preview: boolean;
  raster: boolean;
  scenario: string;
  onSwitchProvider: () => void;
  onToggleRaster: () => void;
  onRetry: () => void;
  onClearPlaces: () => void;
  onScenarioChange: (value: string) => void;
};

// The parent keeps the native Dialog mounted, and resets this content on open
// so development tools are always an explicit opt-in for each menu visit.
export default function AtlasMenu({
  preview,
  raster,
  scenario,
  onSwitchProvider,
  onToggleRaster,
  onRetry,
  onClearPlaces,
  onScenarioChange,
}: AtlasMenuProps) {
  return (
    <div className="about-content atlas-menu">
      <BrandMark />
      <h3>ClearSky</h3>
      <p>
        Explore California places through environment, health and community
        evidence. Compare locations and discover nearby essentials.
      </p>
      {preview && (
        <p className="atlas-menu-preview" role="status">
          Synthetic preview is active. These examples are not live evidence.
        </p>
      )}
      <p className="atlas-menu-coverage">
        All 23 supported tract measures use CalEnviroScreen 5.0. Healthcare and
        public schools use source-listed CDPH and CDE inventories; listings do
        not guarantee access. Power plants are unavailable in live evidence.
      </p>
      <p className="small">
        Tract statistics describe areas, not individual risk. Open a measure or
        facility for its source, measurement period and limitations.
        Straight-line distance is not travel time.
      </p>
      <div className="menu-actions">
        <button onClick={onClearPlaces}>Clear all places</button>
      </div>
      <details className="atlas-menu-advanced">
        <summary>Advanced tools</summary>
        <p>
          For controlled testing and troubleshooting. Synthetic preview uses
          separate example data; switching to or from it clears selected places
          and evidence.
        </p>
        <div className="menu-actions">
          <button onClick={onSwitchProvider}>
            <Icon name="layers" />
            {preview ? "Return to live evidence" : "Explore synthetic preview"}
            <Icon name="arrow" size={17} />
          </button>
          <button onClick={onToggleRaster}>
            Use {raster ? "vector" : "fallback raster"} basemap
          </button>
          <button onClick={onRetry}>Retry map &amp; evidence</button>
        </div>
        {preview && (
          <label className="scenario">
            Preview scenario
            <select
              value={scenario}
              onChange={(event) => onScenarioChange(event.target.value)}
            >
              <option value="normal">Typical values</option>
              <option value="missing">Missing observation</option>
              <option value="zero">Valid zero</option>
              <option value="incompatible">Incompatible evidence</option>
              <option value="failure">Source failure</option>
            </select>
          </label>
        )}
      </details>
      <p className="small">
        Map data © OpenStreetMap contributors, OpenMapTiles and OpenFreeMap.
        City buildings and parts use Overture; coverage and heights vary by
        source.
      </p>
    </div>
  );
}
