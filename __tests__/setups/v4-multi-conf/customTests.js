module.exports = testRef => {
  it("should state the time taken by the plugin in both configs", () => {
    expect(testRef.smpOutput).toMatch(
      /DefinePlugin.* took .*([0-9]+ mins? )?[0-9]+(\.[0-9]+)? secs/
    );
    expect(testRef.smpOutput).toMatch(
      /IgnorePlugin.* took .*([0-9]+ mins? )?[0-9]+(\.[0-9]+)? secs/
    );
  });
};
