const { addon } = require('openvinojs-node');

const cv = require('opencv.js');
const imagenetClassesMap = require('../assets/imagenet_classes_map.json');

run();

async function run()
{
  const { getMaxElement, getImageData } = await import('../common/index.mjs');
  /*   ---Load an image---   */
  //read image from a file
  const imgPath = process.argv[3] || '../assets/images/shih_tzu.jpg';
  const imgData = await getImageData(imgPath);
  const src = cv.matFromImageData(imgData);
  cv.cvtColor(src, src, cv.COLOR_RGBA2BGR);
  cv.resize(src, src, new cv.Size(227, 227));

  /*   ---Load the model---   */
  const modelPath = process.argv[2];
  const model = new addon.Model().readModel(modelPath);

  new addon.PrePostProcessor(model)
    .set_input_tensor_shape([1, 227, 227, 3])
    .set_input_tensor_layout('NHWC')
    .set_input_model_layout('NCHW')
    .build();

  const tensor = new addon.Tensor(
    addon.element.f32,
    [1, 227, 227, 3],
    new Float32Array(src.data),
  );

  /*   ---Compile model and perform inference---   */
  const output = model.compile('CPU').infer(tensor);

  //show the results
  const result = getMaxElement(output.data);
  console.log('Result: ' + imagenetClassesMap[result.index],
    '\nIndex: ', result.index);
}
