// import React from 'react';
// import { View, StyleSheet, Dimensions, Text } from 'react-native';
// import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

// const { width, height } = Dimensions.get('window');

// const districts = [
//   {
//     name: "Tevragh Zeina",
//     coordinates: [
//       { latitude: 18.085292626956782, longitude: -15.990862627864203 },
//       { latitude: 18.085257615997904, longitude: -15.991347563451459 },
//       { latitude: 18.084673022948213, longitude: -15.992762180261323 },
//       { latitude: 18.084398762390567, longitude: -15.99387633597032 },
//       { latitude: 18.084127426367644, longitude: -15.995232925587159 },
//       { latitude: 18.084045733719776, longitude: -15.99648823136663 },
//       { latitude: 18.08513930116681, longitude: -16.000785794423862 },
//       { latitude: 18.09749266891977, longitude: -16.01915612630061 },
//       { latitude: 18.098208493517923, longitude: -16.01951199481589 },
//       { latitude: 18.110262057627466, longitude: -16.022970649814294 },
//       { latitude: 18.11791092225652, longitude: -16.02277144445604 },
//       { latitude: 18.128591768093084, longitude: -16.01221447897727 },
//       { latitude: 18.130091372773027, longitude: -16.00344159986191 },
//       { latitude: 18.133354586560703, longitude: -16.004184982532813 },
//       { latitude: 18.135649643629833, longitude: -15.99596734269708 },
//       { latitude: 18.132692307824033, longitude: -15.988550532839902 },
//       { latitude: 18.12420958328361, longitude: -15.986748988961407 },
//       { latitude: 18.12183939157068, longitude: -15.98666285939675 },
//       { latitude: 18.11853649369222, longitude: -15.975230867566623 },
//       { latitude: 18.120338835949454, longitude: -15.970572121411882 },
//       { latitude: 18.11641814284478, longitude: -15.966971556072743 },
//       { latitude: 18.11174866458607, longitude: -15.96587855628597 },
//       { latitude: 18.106310749405775, longitude: -15.965658532677251 },
//       { latitude: 18.101518299915075, longitude: -15.966560469661427 },
//       { latitude: 18.101310469345762, longitude: -15.96448523042655 },
//       { latitude: 18.097635748788264, longitude: -15.966406261008228 },
//       { latitude: 18.095059957532065, longitude: -15.966139975797002 },
//       { latitude: 18.094917184585967, longitude: -15.966592597507189 },
//       { latitude: 18.092470124516048, longitude: -15.966212042942681 },
//       { latitude: 18.092794830230606, longitude: -15.968854386013806 },
//       { latitude: 18.097345889167322, longitude: -15.9680047073246 },
//       { latitude: 18.09802011161695, longitude: -15.968492988206272 },
//       { latitude: 18.098392556334137, longitude: -15.96899131603512 },
//       { latitude: 18.099966786356447, longitude: -15.974718160977103 },
//       { latitude: 18.092559872426236, longitude: -15.976019619586525 },
//       { latitude: 18.09311599546412, longitude: -15.979366055505626 },
//       { latitude: 18.097019691146695, longitude: -15.983174750475602 },
//       { latitude: 18.095656099672038, longitude: -15.985637786943816 },
//       { latitude: 18.092696587801584, longitude: -15.989753415837153 },
//       { latitude: 18.092353822521996, longitude: -15.989556201480676 },
//       { latitude: 18.088665535355577, longitude: -15.9900806380445 },
//       { latitude: 18.085816475488944, longitude: -15.989581022733551 },
//       { latitude: 18.085292626956782, longitude: -15.990862627864203 }, // Closed
//     ],
//   },
//   {
//     name: "Dar Naim",
//     coordinates: [
//       { latitude: 18.158426870340293, longitude: -15.900444991271211 },
//       { latitude: 18.15557715279435, longitude: -15.89624118674888 },
//       { latitude: 18.135761982831507, longitude: -15.900439031831166 },
//       { latitude: 18.121406446579105, longitude: -15.905758681916874 },
//       { latitude: 18.08713085803071, longitude: -15.926735932958765 },
//       { latitude: 18.081323631351516, longitude: -15.932640073200869 },
//       { latitude: 18.08054673641729, longitude: -15.933866475131701 },
//       { latitude: 18.074253505342206, longitude: -15.934832400860222 },
//       { latitude: 18.07105659325174, longitude: -15.935837849569904 },
//       { latitude: 18.079132905464743, longitude: -15.965061606025113 },
//       { latitude: 18.08845976997436, longitude: -15.960957837005708 },
//       { latitude: 18.130478254137273, longitude: -15.927882757493427 },
//       { latitude: 18.135284591961206, longitude: -15.924554602427676 },
//       { latitude: 18.158426870340293, longitude: -15.900444991271211 }, // Closed
//     ],
//   },
//   {
//     name: "Bouhdida",
//     coordinates: [
//       { latitude: 18.089401523545757, longitude: -15.9251566212786 },
//       { latitude: 18.08764790387082, longitude: -15.916488937228502 },
//       { latitude: 18.086648035413795, longitude: -15.912625560669984 },
//       { latitude: 18.069312765773244, longitude: -15.914428951654816 },
//       { latitude: 18.06942949074133, longitude: -15.916080102820805 },
//       { latitude: 18.065826464767706, longitude: -15.916378903757224 },
//       { latitude: 18.060290503249306, longitude: -15.916273695079218 },
//       { latitude: 18.054111475238408, longitude: -15.92077389680819 },
//       { latitude: 18.05356118818423, longitude: -15.922453007980632 },
//       { latitude: 18.05335568165193, longitude: -15.924164875311286 },
//       { latitude: 18.056376827061953, longitude: -15.925924716674016 },
//       { latitude: 18.059375480923627, longitude: -15.928182656088712 },
//       { latitude: 18.061781823361272, longitude: -15.927470536335106 },
//       { latitude: 18.062575051660666, longitude: -15.929924213171766 },
//       { latitude: 18.06341280715819, longitude: -15.93311637958324 },
//       { latitude: 18.06596802526945, longitude: -15.937385207132108 },
//       { latitude: 18.068359710092835, longitude: -15.936663326357586 },
//       { latitude: 18.070940198242862, longitude: -15.935671081462567 },
//       { latitude: 18.08040577022384, longitude: -15.933802812038747 },
//       { latitude: 18.087181321421976, longitude: -15.926528573530362 },
//       { latitude: 18.089401523545757, longitude: -15.9251566212786 }, // Closed
//     ],
//   },
//   {
//     name: "Toujounine",
//     coordinates: [
//       { latitude: 18.050711697731103, longitude: -15.932348810984712 },
//       { latitude: 18.058951778393286, longitude: -15.925291478483658 },
//       { latitude: 18.05462946404965, longitude: -15.899676772357946 },
//       { latitude: 18.05832563032603, longitude: -15.88129194596958 },
//       { latitude: 18.066190417363256, longitude: -15.880346728322442 },
//       { latitude: 18.080230319976383, longitude: -15.89197213664951 },
//       { latitude: 18.083535906021385, longitude: -15.899359141612827 },
//       { latitude: 18.08720918310339, longitude: -15.92668743348213 },
//       { latitude: 18.08044493238034, longitude: -15.933864721204062 },
//       { latitude: 18.07943539713679, longitude: -15.934041070073592 },
//       { latitude: 18.077425915429593, longitude: -15.934379619952121 },
//       { latitude: 18.076795473780443, longitude: -15.934489590519513 },
//       { latitude: 18.074659161959257, longitude: -15.934778343265249 },
//       { latitude: 18.068432192631825, longitude: -15.936625638209879 },
//       { latitude: 18.066679351587222, longitude: -15.930318908940306 },
//       { latitude: 18.065665241311805, longitude: -15.930229283998735 },
//       { latitude: 18.050711697731103, longitude: -15.932348810984712 }, // Closed
//     ],
//   },
//   {
//     name: "Sebkha",
//     coordinates: [
//       { latitude: 18.05607051360979, longitude: -16.021471488830326 },
//       { latitude: 18.062644733660054, longitude: -16.02149959808006 },
//       { latitude: 18.09259321634453, longitude: -16.023153842542847 },
//       { latitude: 18.09263715415042, longitude: -16.023107608059203 },
//       { latitude: 18.094292397719666, longitude: -16.022938095974837 },
//       { latitude: 18.096929036587003, longitude: -16.022075125394377 },
//       { latitude: 18.09765686920571, longitude: -16.02135920096706 },
//       { latitude: 18.097698213159415, longitude: -16.019532378952135 },
//       { latitude: 18.085182993008345, longitude: -16.00088978043543 },
//       { latitude: 18.084611689642887, longitude: -15.999712490976236 },
//       { latitude: 18.08424386320042, longitude: -15.998444640784353 },
//       { latitude: 18.08411473246082, longitude: -15.997407308814067 },
//       { latitude: 18.08409125413151, longitude: -15.995476718755894 },
//       { latitude: 18.084232790245984, longitude: -15.994099976312501 },
//       { latitude: 18.085265111257062, longitude: -15.991141102351696 },
//       { latitude: 18.08665650953456, longitude: -15.986587908644339 },
//       { latitude: 18.084787763577346, longitude: -15.986123257827046 },
//       { latitude: 18.081614429203935, longitude: -15.98509480698904 },
//       { latitude: 18.08103045417426, longitude: -15.984762054866565 },
//       { latitude: 18.080860127757894, longitude: -15.984550885250375 },
//       { latitude: 18.080537723731446, longitude: -15.98441650458553 },
//       { latitude: 18.08044039409765, longitude: -15.984378110109859 },
//       { latitude: 18.080324815087394, longitude: -15.983981367194598 },
//       { latitude: 18.079619173143396, longitude: -15.98395577087179 },
//       { latitude: 18.079211602808474, longitude: -15.983667812304262 },
//       { latitude: 18.078700617767858, longitude: -15.983309463864668 },
//       { latitude: 18.078548538584155, longitude: -15.983059899759962 },
//       { latitude: 18.07833562752703, longitude: -15.982157629581707 },
//       { latitude: 18.076383551875466, longitude: -15.982682755405466 },
//       { latitude: 18.075630550987, longitude: -15.983235379301 },
//       { latitude: 18.07500012915526, longitude: -15.983806423890906 },
//       { latitude: 18.073143873887517, longitude: -15.986882696417792 },
//       { latitude: 18.066255980561532, longitude: -15.997715116163912 },
//       { latitude: 18.066406206421046, longitude: -15.997796518532516 },
//       { latitude: 18.06197145746385, longitude: -16.00498684668018 },
//       { latitude: 18.060885581155183, longitude: -16.00704499000251 },
//       { latitude: 18.060825698128102, longitude: -16.00708798724723 },
//       { latitude: 18.06071412756264, longitude: -16.00744155924723 },
//       { latitude: 18.060598610984357, longitude: -16.007418778121565 },
//       { latitude: 18.05805833125088, longitude: -16.014336038166675 },
//       { latitude: 18.056147823557428, longitude: -16.021595780436947 },
//       { latitude: 18.05607051360979, longitude: -16.021471488830326 }, // Closed
//     ],
//   },
//   {
//     name: "El Mina",
//     coordinates: [
//       { latitude: 18.053703074068014, longitude: -15.983088193901033 },
//       { latitude: 18.0567912339076, longitude: -15.985334120184024 },
//       { latitude: 18.057083729948356, longitude: -15.985689624571432 },
//       { latitude: 18.057259227339138, longitude: -15.986209207906876 },
//       { latitude: 18.06856796460798, longitude: -15.994107881632988 },
//       { latitude: 18.075451333799226, longitude: -15.983248301232937 },
//       { latitude: 18.076451393897344, longitude: -15.98257128475562 },
//       { latitude: 18.075946413968335, longitude: -15.982008841069842 },
//       { latitude: 18.070443735366446, longitude: -15.978110502576174 },
//       { latitude: 18.070345364078793, longitude: -15.977953220455806 },
//       { latitude: 18.06992039948297, longitude: -15.97757243216439 },
//       { latitude: 18.075142720205918, longitude: -15.96941495780385 },
//       { latitude: 18.075165545338134, longitude: -15.969232481666879 },
//       { latitude: 18.07728406813011, longitude: -15.96606661665736 },
//       { latitude: 18.058361468141648, longitude: -15.974427805262717 },
//       { latitude: 18.053703074068014, longitude: -15.983088193901033 }, // Closed
//     ],
//   },
//   {
//     name: "Ksar",
//     coordinates: [
//       { latitude: 18.11310983607658, longitude: -15.94192097831728 },
//       { latitude: 18.121859335040995, longitude: -15.953651489405553 },
//       { latitude: 18.105553644946394, longitude: -15.96126080397325 },
//       { latitude: 18.106278009715904, longitude: -15.96560324986364 },
//       { latitude: 18.10153373177229, longitude: -15.96658444438109 },
//       { latitude: 18.10143129713639, longitude: -15.964416169261069 },
//       { latitude: 18.100602556477007, longitude: -15.964459009406717 },
//       { latitude: 18.097666467613013, longitude: -15.966393730119009 },
//       { latitude: 18.094946256634362, longitude: -15.966198809905437 },
//       { latitude: 18.095298334003626, longitude: -15.9642079293354 },
//       { latitude: 18.092811772341857, longitude: -15.96354816076663 },
//       { latitude: 18.088289660520278, longitude: -15.961846652360828 },
//       { latitude: 18.11310983607658, longitude: -15.94192097831728 }, // Closed
//     ],
//   },
//   {
//     name: "F-Nord",
//     coordinates: [
//       { latitude: 18.1062915748894, longitude: -15.966588121988213 },
//       { latitude: 18.10721505463928, longitude: -15.97168442936897 },
//       { latitude: 18.10756998795354, longitude: -15.973060596496415 },
//       { latitude: 18.10755375423479, longitude: -15.972500385932827 },
//       { latitude: 18.111467193339017, longitude: -15.972111431619604 },
//       { latitude: 18.125605145711265, longitude: -15.978761192396911 },
//       { latitude: 18.131422740156108, longitude: -15.961606054202655 },
//       { latitude: 18.128866539181026, longitude: -15.960832473034747 },
//       { latitude: 18.123583177708074, longitude: -15.968156469976877 },
//       { latitude: 18.11623849686876, longitude: -15.96507060837455 },
//       { latitude: 18.1062915748894, longitude: -15.966588121988213 }, // Closed
//     ],
//   },
//   {
//     name: "Centre Émetteur",
//     coordinates: [
//       { latitude: 18.10797963614303, longitude: -15.998920143804078 },
//       { latitude: 18.12715947890807, longitude: -16.002764556905298 },
//       { latitude: 18.12906653497688, longitude: -15.992996737222999 },
//       { latitude: 18.118349131196904, longitude: -15.992786889867393 },
//       { latitude: 18.111353319418004, longitude: -15.99017818749232 },
//       { latitude: 18.10797963614303, longitude: -15.998920143804078 }, // Closed
//     ],
//   },
//   {
//     name: "Premier",
//     coordinates: [
//       { latitude: 18.113265998547664, longitude: -15.941649026477622 },
//       { latitude: 18.122126153940503, longitude: -15.953588193424096 },
//       { latitude: 18.133611916712542, longitude: -15.947960645327322 },
//       { latitude: 18.14673385432958, longitude: -15.940488442758411 },
//       { latitude: 18.13548650428224, longitude: -15.924023779377935 },
//       { latitude: 18.113265998547664, longitude: -15.941649026477622 }, // Closed
//     ],
//   },
//   {
//     name: "Ain Ettalh",
//     coordinates: [
//       { latitude: 18.155759795956595, longitude: -15.938952142456378 },
//       { latitude: 18.151685265497335, longitude: -15.932002006796672 },
//       { latitude: 18.15674105936339, longitude: -15.928139636552926 },
//       { latitude: 18.154478178115323, longitude: -15.925583678368929 },
//       { latitude: 18.14958549677565, longitude: -15.92551922258818 },
//       { latitude: 18.146931460213292, longitude: -15.92854396787552 },
//       { latitude: 18.139936187897572, longitude: -15.919491541465423 },
//       { latitude: 18.136043089856717, longitude: -15.923290011303992 },
//       { latitude: 18.13538276800793, longitude: -15.923914794553074 },
//       { latitude: 18.131130826450477, longitude: -15.92747146824076 },
//       { latitude: 18.144017494054168, longitude: -15.944464534577993 },
//       { latitude: 18.148606027357808, longitude: -15.943198563776336 },
//       { latitude: 18.152253495554433, longitude: -15.941217006748495 },
//       { latitude: 18.155759795956595, longitude: -15.938952142456378 }, // Closed
//     ],
//   },
//   {
//     name: "Melleh",
//     coordinates: [
//       { latitude: 18.026529282447584, longitude: -15.95844435625494 },
//       { latitude: 18.033551919545715, longitude: -15.954149360782251 },
//       { latitude: 18.039080181480948, longitude: -15.952263753054124 },
//       { latitude: 18.055763522590883, longitude: -15.943097604271172 },
//       { latitude: 18.066768680543962, longitude: -15.9397454127545 },
//       { latitude: 18.06269003357943, longitude: -15.931092627856081 },
//       { latitude: 18.048817355990558, longitude: -15.935684569634363 },
//       { latitude: 18.036249397012423, longitude: -15.942465193977567 },
//       { latitude: 18.02592504478243, longitude: -15.953666098819115 },
//       { latitude: 18.02506805553947, longitude: -15.955597289286617 },
//       { latitude: 18.026529282447584, longitude: -15.95844435625494 }, // Closed
//     ],
//   },
//   {
//     name: "Etterhil",
//     coordinates: [
//       { latitude: 18.00304363138721, longitude: -15.937944623179042 },
//       { latitude: 18.0116462111408, longitude: -15.93853778151135 },
//       { latitude: 18.016017853211235, longitude: -15.944691799294631 },
//       { latitude: 18.01813312486628, longitude: -15.944246930545402 },
//       { latitude: 18.022976463413393, longitude: -15.95123425529603 },
//       { latitude: 18.028564843517113, longitude: -15.950827303448571 },
//       { latitude: 18.03881609178016, longitude: -15.941219599449067 },
//       { latitude: 18.048047130049607, longitude: -15.936041739711191 },
//       { latitude: 18.05328608463591, longitude: -15.93413727132495 },
//       { latitude: 18.052413051092326, longitude: -15.930556154651507 },
//       { latitude: 18.05319877982623, longitude: -15.928857419048514 },
//       { latitude: 18.052849567489186, longitude: -15.924863094792833 },
//       { latitude: 18.052762264296526, longitude: -15.924771271246723 },
//       { latitude: 18.05140905926603, longitude: -15.923302094509001 },
//       { latitude: 18.047436687560708, longitude: -15.927801448268276 },
//       { latitude: 18.044817492289457, longitude: -15.929454272098214 },
//       { latitude: 18.043682495557583, longitude: -15.92738824231079 },
//       { latitude: 18.045415781652224, longitude: -15.926202643067565 },
//       { latitude: 18.045227068594276, longitude: -15.924680999990251 },
//       { latitude: 18.041024206314745, longitude: -15.916890868275186 },
//       { latitude: 18.041800071270064, longitude: -15.915404631329835 },
//       { latitude: 18.04019295520718, longitude: -15.911324801464631 },
//       { latitude: 18.03667387393738, longitude: -15.91246132599738 },
//       { latitude: 18.020583528366007, longitude: -15.925794281892447 },
//       { latitude: 18.017978570642203, longitude: -15.926377114730338 },
//       { latitude: 18.014126487986186, longitude: -15.929874111810607 },
//       { latitude: 18.009359765652928, longitude: -15.932380293013544 },
//       { latitude: 18.009549125169176, longitude: -15.932360340335933 },
//       { latitude: 18.00304363138721, longitude: -15.937944623179042 }, // Closed
//     ],
//   },
//   {
//     name: "Elvelouja",
//     coordinates: [
//       { latitude: 18.068473570137147, longitude: -15.945968113944867 },
//       { latitude: 18.067861343948007, longitude: -15.943327737592481 },
//       { latitude: 18.066760059934673, longitude: -15.93955350668458 },
//       { latitude: 18.055911204547183, longitude: -15.942960755567679 },
//       { latitude: 18.057661015976382, longitude: -15.948971331339282 },
//       { latitude: 18.06290650616435, longitude: -15.94998083624824 },
//       { latitude: 18.064190628733385, longitude: -15.94712979978161 },
//       { latitude: 18.068473570137147, longitude: -15.945968113944867 }, // Closed
//     ],
//   },
//   {
//     name: "Riyadh",
//     coordinates: [
//       { latitude: 18.037799901807805, longitude: -15.98930852698714 },
//       { latitude: 18.038795951471474, longitude: -15.985326352330924 },
//       { latitude: 18.038750682389256, longitude: -15.985311600182182 },
//       { latitude: 18.038634640464025, longitude: -15.98519894739232 },
//       { latitude: 18.038586183373422, longitude: -15.985113116708735 },
//       { latitude: 18.038562592416575, longitude: -15.984926032640612 },
//       { latitude: 18.038561317230666, longitude: -15.984925362076817 },
//       { latitude: 18.038581082627285, longitude: -15.98485026022868 },
//       { latitude: 18.038690748659338, longitude: -15.984774487822445 },
//       { latitude: 18.038760883877373, longitude: -15.984610873074793 },
//       { latitude: 18.038868637021668, longitude: -15.984487491460412 },
//       { latitude: 18.039016558387367, longitude: -15.984447928879698 },
//       { latitude: 18.03941194550187, longitude: -15.98287671906444 },
//       { latitude: 18.041288228491776, longitude: -15.972919919036588 },
//       { latitude: 18.03881355256704, longitude: -15.97240191821631 },
//       { latitude: 18.036701867379673, longitude: -15.972403947101515 },
//       { latitude: 18.031918884526988, longitude: -15.973261161726587 },
//       { latitude: 18.030464637354598, longitude: -15.964698590342712 },
//       { latitude: 18.02932241323138, longitude: -15.964313975036326 },
//       { latitude: 18.031076798137736, longitude: -15.955496188076413 },
//       { latitude: 18.033425930361027, longitude: -15.954100810060645 },
//       { latitude: 18.031300943813367, longitude: -15.95064707803179 },
//       { latitude: 18.02276773187385, longitude: -15.957509665144892 },
//       { latitude: 18.014500151767006, longitude: -15.959142359803398 },
//       { latitude: 18.01003977299785, longitude: -15.95957389232133 },
//       { latitude: 17.99330778264045, longitude: -15.958585236118294 },
//       { latitude: 17.980142175702518, longitude: -15.962233015914265 },
//       { latitude: 17.973162716926247, longitude: -15.962365441915257 },
//       { latitude: 17.971467525526524, longitude: -15.97202027123565 },
//       { latitude: 17.98067408655697, longitude: -15.97879915607084 },
//       { latitude: 18.003188004597263, longitude: -15.983009799910413 },
//       { latitude: 18.005047962173762, longitude: -15.992222901121204 },
//       { latitude: 18.005161475377726, longitude: -15.992003630539587 },
//       { latitude: 18.005416560959, longitude: -15.991825934196786 },
//       { latitude: 18.006060206747218, longitude: -15.9919201180014 },
//       { latitude: 18.006427518102477, longitude: -15.991762149301314 },
//       { latitude: 18.00673281462242, longitude: -15.991719691202768 },
//       { latitude: 18.00729638433602, longitude: -15.99247838587325 },
//       { latitude: 18.007091042661667, longitude: -15.992933690854942 },
//       { latitude: 18.00726242525679, longitude: -15.993590307993793 },
//       { latitude: 18.01395196931046, longitude: -15.994542359628714 },
//       { latitude: 18.02186525262257, longitude: -15.991753267641656 },
//       { latitude: 18.037799901807805, longitude: -15.98930852698714 }, // Closed
//     ],
//   },
//   // Add more districts here if additional data is available (e.g., Arafat, Teyarett). For now, using provided data.
// ];

// // Simple centroid calculation (average of coordinates)
// const calculateCentroid = (coordinates) => {
//   const lats = coordinates.map(coord => coord.latitude);
//   const lngs = coordinates.map(coord => coord.longitude);
//   const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
//   const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
//   return { latitude: avgLat, longitude: avgLng };
// };

// const Testmap = () => {
//   const polygons = districts.map(district => ({
//     ...district,
//     center: calculateCentroid(district.coordinates),
//   }));

//   return (
//     <View style={styles.container}>
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: 18.0735,
//           longitude: -15.9582,
//           latitudeDelta: 0.3,
//           longitudeDelta: 0.3,
//         }}
//         mapType="satellite"
//         // light
        
//         provider={PROVIDER_DEFAULT} // Ensures consistent rendering across devices/providers
//       >
//         {polygons.map((district, index) => (
//           <React.Fragment key={index}>
//             <Polygon
//               coordinates={district.coordinates}
//               strokeColor="#000000" // Explicit full color for consistency
//               fillColor="transparent"
//               strokeWidth={1.5} // Slightly increased for clarity on all devices, uniform
//               lineJoin="round" // Smoother, cleaner corners
//               lineCap="round" // Cleaner line ends
//             />
//             <Marker coordinate={district.center}>
//               <View style={styles.label}>
//                 <Text style={styles.labelText}>{district.name}</Text>
//               </View>
//             </Marker>
//           </React.Fragment>
//         ))}
//       </MapView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   label: {
//     backgroundColor: 'transparent', // No background for clean, unobtrusive names
//     paddingHorizontal: 0,
//     paddingVertical: 0,
//   },
//   labelText: {
//     fontSize: 9, // Small size for minimal footprint, room for more details
//     fontWeight: 'bold',
//     color: '#000000',
//     textAlign: 'center',
//   },
// });

// export default Testmap;

import { View, Text } from 'react-native'
import React from 'react'

const TestMap = () => {
  return (
    <View>
      <Text>TestMap</Text>
    </View>
  )
}

export default TestMap