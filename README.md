![Logo](admin/pushbullet.png)
ioBroker pushbullet Adapter
==============

Send pushbullet notifications from ioBroker. 
This Adapter is mostly based on bluefox's Pushover Adapter for ioBroker.

### 0.0.6 (2015-07-225)
* (Jens1809) Publish on NPM

## Install

```npm install https://github.com/Jens1809/iobroker.pushbullet/tarball/master/```

## Configuration


## Usage

To send notification from ScriptEngine just write: 

```javascript
// send note
sendTo("pushbullet", "message body");

//OR

sendTo("pushbullet", {
    message: "message body",    //The Message you want to send
    title: "title",             //The Title of your message
    type: "note"                //Type Note
});

// send link
sendTo("pushbullet", {
    link: "http://www.example.com", //The Link you want to send
    title: "Title",             //The Title of your link
    type: "link"                //Type link
});

// send file

sendTo("pushbullet", {
    file: "/path/to/file",  //The file you want to send
    title: "Title",         //The Title of your file
    type: "file"            //Type file
});

```

## License

The MIT License (MIT)

Copyright (c) 2015 Jens1809

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

