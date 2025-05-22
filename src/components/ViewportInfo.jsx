import React from "react";
import { useFelt } from "../utils/feltUtils";

export function ViewportInfo() {
  const felt = useFelt();
  const [viewport, setViewport] = React.useState(null);

  React.useEffect(() => {
    felt.getViewport().then(setViewport);

    return felt.onViewportMove({
      handler: (viewport) => {
        setViewport(viewport);
      },
    });
  }, []);

  return (
    <dl className="p-3 space-y-1 font-mono">
      <div className="grid grid-cols-2">
        <dt>Center</dt>
        <dd className="text-right">
          {viewport
            ? viewport?.center.latitude.toFixed(4) +
              ", " +
              viewport?.center.longitude.toFixed(4)
            : "–"}
        </dd>
      </div>
      <div className="grid grid-cols-2">
        <dt>Zoom</dt>
        <dd className="text-right">{viewport?.zoom.toFixed(2) ?? "–"}</dd>
      </div>
    </dl>
  );
}
