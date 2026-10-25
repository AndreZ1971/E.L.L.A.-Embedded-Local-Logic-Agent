import React from "react";
import type { HudWidgetData } from "./widgetRegistry";
import HudSystemPanel from "./HudSystemPanel";
import HudMonitorPanel from "./HudMonitorPanel";
import HudRoutinesPanel from "./HudRoutinesPanel";
import HudDirectivePanel from "./HudDirectivePanel";
import HudClockWidget from "./HudClockWidget";
import HudTasksWidget from "./HudTasksWidget";
import HudMailWidget from "./HudMailWidget";
import HudMusicWidget from "./HudMusicWidget";

const HudWidgetSlot: React.FC<{ widgetId: string; data: HudWidgetData }> = ({
  widgetId,
  data,
}) => {
  switch (widgetId) {
    case "system":
      return <HudSystemPanel data={data.telemetry} />;
    case "monitors":
      return <HudMonitorPanel monitors={data.monitors} />;
    case "routines":
      return <HudRoutinesPanel setups={data.setups} />;
    case "directive":
      return <HudDirectivePanel cloudToday={data.cloudToday} />;
    case "clock":
      return <HudClockWidget />;
    case "tasks":
      return (
        <HudTasksWidget count={data.tasks.count} tasks={data.tasks.items} />
      );
    case "mails":
      return (
        <HudMailWidget
          source={data.mails.source}
          unreadCount={data.mails.unreadCount}
          mails={data.mails.items}
        />
      );
    case "music":
      return <HudMusicWidget nowPlaying={data.nowPlaying} />;
    default:
      return null;
  }
};

export default HudWidgetSlot;
