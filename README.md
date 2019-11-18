# Morphic Quickstrip Customization Tool

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm start`

Serves the build folder using a static server.<br>
Open [http://localhost:5000](http://localhost:5000) to view it in the browser.


### sgithens notes

The npm serve doens't seem to work well in it's current configuration after changing
the homepage options in package.json, so we can test the static build with the below:

```bash
npm run build
cp -R build quickstrip-customization
python -m SimpleHTTPServer 5000
```

Also, for some reason the app doesn't seem to work on higher ports. If you used this
on port 8080, the js throws up all sorts of recursive rendering errors.
