const { appendLoader } = require("./utils");

describe("appendLoader", () => {
  const expectedMappings = [
    {
      name: "single loader",
      from: {
        test: /\.jsx?$/,
        loader: "babel-loader",
      },
      to: {
        test: /\.jsx?$/,
        use: ["babel-loader", "speed-measure-webpack-plugin/loader"],
      },
    },

    {
      name: "single use",
      from: {
        test: /\.jsx?$/,
        use: ["babel-loader"],
      },
      to: {
        test: /\.jsx?$/,
        use: ["babel-loader", "speed-measure-webpack-plugin/loader"],
      },
    },

    {
      name: "single complex use",

      from: {
        test: /\.jsx?$/,
        use: [{ loader: "babel-loader", options: {} }],
      },
      to: {
        test: /\.jsx?$/,
        use: [
          { loader: "babel-loader", options: {} },
          "speed-measure-webpack-plugin/loader",
        ],
      },
    },

    {
      name: "multiple uses",

      from: {
        test: /\.jsx?$/,
        use: [{ loader: "babel-loader", options: {} }, "thread-loader"],
      },
      to: {
        test: /\.jsx?$/,
        use: [
          { loader: "babel-loader", options: {} },
          "thread-loader",
          "speed-measure-webpack-plugin/loader",
        ],
      },
    },

    {
      name: "oneOf",

      from: {
        test: /\.jsx?$/,
        oneOf: [{ use: ["babel-loader"] }, { use: ["thread-loader"] }],
      },
      to: {
        test: /\.jsx?$/,
        oneOf: [
          {
            use: ["babel-loader", "speed-measure-webpack-plugin/loader"],
          },
          {
            use: ["thread-loader", "speed-measure-webpack-plugin/loader"],
          },
        ],
      },
    },

    {
      name: "array",
      from: [
        {
          test: /\.jsx?$/,
          loader: "babel-loader",
        },
        {
          test: /\.css$/,
          loader: "css-loader",
        },
      ],
      to: [
        {
          test: /\.jsx?$/,
          use: ["babel-loader", "speed-measure-webpack-plugin/loader"],
        },
        {
          test: /\.css$/,
          use: ["css-loader", "speed-measure-webpack-plugin/loader"],
        },
      ],
    },
  ];

  expectedMappings.forEach(mapping => {
    it('should create the expected mapping for "' + mapping.name + '"', () => {
      expect(appendLoader(mapping.from)).toEqual(mapping.to);
    });
  });
});
