# powerquery-formatter

[![Build Status](https://dev.azure.com/ms/powerquery-formatter/_apis/build/status/Microsoft.powerquery-formatter?branchName=master)](https://dev.azure.com/ms/powerquery-formatter/_build/latest?definitionId=343&branchName=master)

This project contains a source code formatter for the Power Query / M language.

## Related projects

- [powerquery-parser](https://github.com/microsoft/powerquery-parser): A lexer + parser for Power Query. Also contains features such as type validation.
- [powerquery-language-services](https://github.com/microsoft/powerquery-language-services): A high level library that wraps the parser for external projects, such as the VSCode extension. Includes features such as Intellisense.
- [vscode-powerquery](https://github.com/microsoft/vscode-powerquery): The VSCode extension for Power Query language support.
- [vscode-powerquery-sdk](https://github.com/microsoft/vscode-powerquery-sdk): The VSCode extension for Power Query connector SDK.

## Build and test

Build

```cmd
npm install
npm run build
```

Test

```cmd
npm test
```

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
