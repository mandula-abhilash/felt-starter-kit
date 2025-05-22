import { FeltController } from "@feltmaps/js-sdk";
import { useFeltEmbed } from "../utils/feltUtils";

const Home = () => {
  const { felt, mapRef } = useFeltEmbed("w9BxV0EmdR2u5C4AyrTke9CB", {
    uiControls: {
      cooperativeGestures: false,
      fullScreenButton: false,
      showLegend: false,
    },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-80 flex-none border-r border-gray-200 overflow-hidden">
        <FeltSidebar felt={felt} />
      </div>
      <div
        className="flex-1 bg-gray-100 relative"
        ref={mapRef}
        style={{
          "& > iframe": {
            position: "relative",
            zIndex: 1,
          },
        }}
      >
        {!felt && (
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-6 w-6 border-2 border-gray-400 rounded-full border-t-transparent"></div>
              <p className="text-sm text-gray-500">Loading map…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FeltSidebar = ({ felt }) => {
  return (
    <div className="flex flex-col h-full text-md overflow-hidden">
      {felt ? (
        <FeltContext.Provider value={felt}>
          <div className="flex flex-col flex-1 overflow-hidden">
            <LayersList />
          </div>
          <div className="flex-none overflow-hidden">
            <ViewportInfo />
          </div>
        </FeltContext.Provider>
      ) : (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="animate-spin h-6 w-6 border-2 border-gray-400 rounded-full border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      )}
    </div>
  );
};

export default Home;
