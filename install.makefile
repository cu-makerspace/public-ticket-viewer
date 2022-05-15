install-packages:
	cd ${SRC_DIR} && npm install --same-dev @babel/core@7.1.0 @babel/cli@7.1.0 @babel/preset-env@7.1.0 @babel/preset-react@7.0.0
	cd ${SRC_DIR} && npm install --save-dev webpack@4.19.1 webpack-cli@3.1.1 webpack-dev-server@3.1.8 style-loader@0.23.0 css-loader@1.0.0 babel-loader@8.0.2
	cd ${SRC_DIR} && npm install --save-dev react@16.5.2 react-dom@16.5.2
	cd ${SRC_DIR} && npm install --save-dev react-hot-loader@4.3.11
