title: Scaling Images with HTML5 Canvas
comments: true
categories: [html5, browser, canvas, javascript]
---
> Had intented to post this 8 months ago but it got lost in the sea of gists..

This is old news by now for most but I had quite a bit of fun implementing it for myself and figured I'd share my code and some learnings that came along with it. The basic idea is to use `canvas` to render an uploaded image and then utilize the `toDataURL` method on canvas to retrieve a Base64 encoded version of the image. In the example included here we will just direct link to the newly scaled image but you could imagine that we kick off an ajax request and actually process the image (in PHP `base64_decode` FTW). Without any more tangential delay let's take a look at the code.

    <input type="file" accept="image/*" id="imageFile" />
    <table>
      <tr>
        <td>Width: <input type="text" id="width" value="200" style="width:30; margin-left: 20px;" /></td>
      </tr>
      <tr>
        <td>Height: <input type="text" id="height" value="200" style="width:30; margin-left: 20px;" /></td>
      </tr>
    </table>
    <canvas id="canvas" style="border: 1px solid black;" width="200" height="200"></canvas>
    <button width="30" id="saveImage">Save Image</button>

The above HTML shouldn't need any explanation but if it does feel free to open the attached JSFiddle to get a feel for it..

    (function(){
      (function(){
          document.getElementById("imageFile").addEventListener("change", fileChanged, false);
        document.getElementById("width").addEventListener("keyup", sizeChanged, false);
        document.getElementById("height").addEventListener("keyup", sizeChanged, false);
        document.getElementById("saveImage").addEventListener("click", share, false);
      }());

      var currentImage,
        canvas = document.getElementById("canvas");

      function sizeChanged() {
        var dimension = this.id,
            value = this.value;
        canvas[dimension] = value;
        if(currentImage) { renderImage() }
      }

      function fileChanged() {
        var file = this.files[0],
            imageType = /^image\//;

            if (!imageType.test(file.type)) {
              console.error("not an image yo!");
            } else {
              var reader = new FileReader();
              reader.onload = function(e) {
                currentImage = e.target.result;
                renderImage();
              };
              reader.readAsDataURL(file);
            }
      }

      function renderImage() {
        var data = currentImage,
          image = document.createElement("img");
        image.src = data;
        image.onload = function() {
            context = canvas.getContext("2d");
          context.drawImage(this, 0, 0, canvas.width, canvas.height);
        }
      }
      function share() {
          document.location = canvas.toDataURL();
      }
    }());

In order to bring the HTML to life we need to attach a few EventHandlers and define some basic functionality. The first things to tackle is the actual file upload.

The File API has been added to the DOM since HTML5 and will be used here to open the uploaded file from `<input type="file">` on the `"change"` event. Inside of the change event there are 2 things that we want to do; (1) confirm the file type, and (2) render the file onto the canvas. The confirm the file type we can use the MIME type given to use from `file.type` and do a simple regex test (`/^image\//`) before attempting to render the unknown file (Even though we've added `accept="image/*"` inside the input that can be easily modified to attempt to upload any file). Once we are convinced that the user has uploaded an image it's time to read the file and send it off to the canvas to render. [`FileReader`'s](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) [`readDataAsURL`](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL) will allow us to process the file asyncronously and allows for an `onload` callback that gives us the ability to set the newly read image and ask the canvas to draw.


### Additional Reading
- [Using files in Web Applications - Mozilla Dev](https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications)

