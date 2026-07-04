(function () {
  var token = document.currentScript?.dataset?.extensionToken || "";
  if (!token) {
    throw new Error("Missing extension activation token");
  }

  function extensionFactory(api) {
    var React = api.React;
    var ChakraUI = api.ChakraUI;
    var Box = ChakraUI.Box;
    var Button = ChakraUI.Button;
    var HStack = ChakraUI.HStack;
    var VStack = ChakraUI.VStack;
    var Text = ChakraUI.Text;

    var EXTENSION_ID = api.identifier;
    var BASE_URL = "https://mc.sjtu.cn/satellite/new_and_cloud";

    var DIMENSIONS = [
      { id: "world", label: "新洲", worldName: "world", cx: 2441, cy: 74, cz: -2363, zoom: 6, views: ["surface", "flat"] },
      { id: "world_nether", label: "下界", worldName: "world_nether", cx: 29, cy: 41, cz: -12, zoom: 6, views: ["flat"] },
      { id: "island1", label: "云端", worldName: "island1", cx: 1064, cy: 55, cz: 1092, zoom: 6, views: ["surface", "flat", "cave"] },
      { id: "resourceworldend", label: "末地", worldName: "resourceworldend", cx: 0, cy: 65, cz: 0, zoom: 6, views: ["surface", "flat"] },
    ];

    var VIEW_MODES = [
      { id: "flat", label: "平面" },
      { id: "surface", label: "立体" },
      { id: "cave", label: "洞穴" },
    ];

    function findDim(id) {
      for (var i = 0; i < DIMENSIONS.length; i++) {
        if (DIMENSIONS[i].id === id) return DIMENSIONS[i];
      }
      return DIMENSIONS[0];
    }

    function buildUrl(dim, viewId) {
      return BASE_URL + "#" + dim.worldName + ";" + viewId + ";" + dim.cx + "," + dim.cy + "," + dim.cz + ";" + dim.zoom;
    }

    var WidgetComponent = function () {
      var host = api.getHostContext();
      var useExtensionState = host.state.useExtensionState;

      var selectedDimId = useExtensionState("dimension", "world")[0];
      var setSelectedDimId = useExtensionState("dimension", "world")[1];
      var selectedViewId = useExtensionState("viewMode", "surface")[0];
      var setSelectedViewId = useExtensionState("viewMode", "surface")[1];

      var refreshState = React.useState(0);
      var refreshKey = refreshState[0];
      var setRefreshKey = refreshState[1];

      var currentDim = findDim(selectedDimId);
      var effectiveViewId = currentDim.views.indexOf(selectedViewId) !== -1 ? selectedViewId : currentDim.views[0];

      function handleDimClick(dimId) {
        var dim = findDim(dimId);
        var view = selectedViewId;
        if (dim.views.indexOf(view) === -1) {
          view = dim.views[0];
        }
        setSelectedDimId(dimId);
        if (view !== selectedViewId) {
          setSelectedViewId(view);
        }
      }

      function handleViewClick(viewId) {
        if (currentDim.views.indexOf(viewId) !== -1) {
          setSelectedViewId(viewId);
        }
      }

      function handleRefresh() {
        setRefreshKey(function (k) { return k + 1; });
      }

      function handleFullscreen() {
        host.actions.openWindow(
          "/standalone/extension/" + EXTENSION_ID + "/map",
          "卫星地图"
        );
      }

      var mapUrl = buildUrl(currentDim, effectiveViewId);
      var iframeKey = "map-" + refreshKey + "-" + currentDim.id + "-" + effectiveViewId;

      return React.createElement(
        VStack,
        { align: "stretch", spacing: 2 },

        // Dimension selector row
        React.createElement(
          HStack,
          { spacing: 1 },
          DIMENSIONS.map(function (dim) {
            var isActive = dim.id === selectedDimId;
            return React.createElement(
              Button,
              {
                key: dim.id,
                size: "xs",
                variant: isActive ? "solid" : "outline",
                colorScheme: isActive ? "blue" : "gray",
                onClick: function () { handleDimClick(dim.id); },
                flex: 1,
                minW: 0,
                px: 1,
              },
              dim.label
            );
          })
        ),

        // Map iframe
        React.createElement(
          Box,
          {
            borderRadius: "md",
            overflow: "hidden",
            borderWidth: "1px",
            borderColor: "whiteAlpha.200",
            bg: "#111",
            h: "360px",
          },
          React.createElement("iframe", {
            key: iframeKey,
            src: mapUrl,
            style: {
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
            },
            title: "卫星地图",
          })
        ),

        // View mode + action buttons row
        React.createElement(
          HStack,
          { spacing: 1, justify: "space-between" },
          React.createElement(
            HStack,
            { spacing: 1 },
            VIEW_MODES.map(function (view) {
              var isSupported = currentDim.views.indexOf(view.id) !== -1;
              var isActive = view.id === effectiveViewId;
              return React.createElement(
                Button,
                {
                  key: view.id,
                  size: "xs",
                  variant: isActive ? "solid" : "outline",
                  colorScheme: isActive ? "green" : "gray",
                  isDisabled: !isSupported,
                  onClick: function () { handleViewClick(view.id); },
                },
                view.label
              );
            })
          ),
          React.createElement(
            HStack,
            { spacing: 1 },
            React.createElement(
              Button,
              {
                size: "xs",
                variant: "outline",
                onClick: handleRefresh,
              },
              "刷新"
            ),
            React.createElement(
              Button,
              {
                size: "xs",
                variant: "outline",
                onClick: handleFullscreen,
              },
              "全屏"
            )
          )
        )
      );
    };

    var StandaloneComponent = function () {
      return React.createElement(
        Box,
        {
          w: "100%",
          h: "100vh",
          bg: "#000",
          p: 0,
          m: 0,
          overflow: "hidden",
        },
        React.createElement("iframe", {
          src: BASE_URL,
          style: {
            width: "100%",
            height: "100vh",
            border: "none",
            display: "block",
          },
          title: "卫星地图",
        })
      );
    };

    return {
      homeWidget: {
        title: "卫星地图",
        defaultWidth: 420,
        minWidth: 320,
        Component: WidgetComponent,
      },
      page: {
        routePath: "map",
        isStandAlone: true,
        Component: StandaloneComponent,
      },
    };
  }

  window.registerExtension(extensionFactory, token);
})();
