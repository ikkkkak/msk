// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   Alert,
//   ScrollView,
//   Dimensions,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
// } from 'react-native';
// import { pickImageNative, pickVideoNative } from '../utils/nativePhotoPicker';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import MapView, { Marker } from 'react-native-maps';
// import { MaterialIcons } from '@expo/vector-icons';
// import { useQuery, useQueryClient } from '@tanstack/react-query';
// import axios from 'axios';
// import * as FileSystem from 'expo-file-system/legacy';
// import { endpoints } from '../constants';
// import { useUser } from '../hooks/useUser';
// import { useLanguage } from '../contexts/LanguageContext';
// import { landmarkFormStyles as styles } from './CreateLandmarkScreen';
// import { useTranslation } from 'react-i18next';

// const { width } = Dimensions.get('window');

// interface City { id: number; name: string; name_ar?: string; }
// interface Zone { id: number; name: string; name_ar?: string; city_id: number; }
// interface Quartier { id: number; name: string; name_ar?: string; zone_id: number; }

// export const EditLandmarkScreen: React.FC = () => {
//   const navigation = useNavigation<any>();
//   const route = useRoute<any>();
//   const { user } = useUser();
//   const queryClient = useQueryClient();
//   const mapRef = useRef<MapView>(null);
//   const { currentLanguage } = useLanguage();
//   const { t } = useTranslation();

//   const landmark = route.params?.landmark;

//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [area, setArea] = useState('');
//   const [price, setPrice] = useState('');
//   const [landType, setLandType] = useState<string>('');
//   const [lots, setLots] = useState<string>('');
//   const [district, setDistrict] = useState('');
//   const [region, setRegion] = useState('');
//   const [zoning, setZoning] = useState('');
//   const [plotNumber, setPlotNumber] = useState('');
//   const [elevation, setElevation] = useState('');
//   const [sides, setSides] = useState<string>('');
//   const [points, setPoints] = useState<Array<{ latitude: number; longitude: number }>>([]);
//   const [highlightLocation, setHighlightLocation] = useState<boolean>(false);
//   const [landmarkImages, setLandmarkImages] = useState<string[]>([]);
//   const [landmarkVideo, setLandmarkVideo] = useState<{ uri: string; mimeType?: string } | null>(null);
//   const [hostPrivateNote, setHostPrivateNote] = useState('');
//   const [paperTypes, setPaperTypes] = useState<string[]>([]);
//   const [customPaperType, setCustomPaperType] = useState('');
//   const PAPER_TYPE_OPTIONS = [
//     'titre_foncier',
//     'quitane',
//     'lettre',
//     'concession',
//     'bornage',
//   ];
//   const normalizePaperType = (paperType: string) => {
//     const normalized = paperType.trim().toLowerCase();
//     const aliasMap: Record<string, string> = {
//       'titre foncier': 'titre_foncier',
//       titre_foncier: 'titre_foncier',
//       quitane: 'quitane',
//       lettre: 'lettre',
//       concession: 'concession',
//       bornage: 'bornage',
//     };
//     return aliasMap[normalized] || paperType.trim();
//   };
//   const getPaperTypeLabel = (paperType: string) => {
//     const key = normalizePaperType(paperType);
//     return t(`listing.common.paperTypes.${key}`, key);
//   };

//   const [selectedCityId, setSelectedCityId] = useState<number | undefined>(undefined);
//   const [selectedZoneId, setSelectedZoneId] = useState<number | undefined>(undefined);
//   const [selectedQuartierId, setSelectedQuartierId] = useState<number | undefined>(undefined);

//   const [areaUnit, setAreaUnit] = useState('m²');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isUploadingImage, setIsUploadingImage] = useState(false);
//   const [currentStep, setCurrentStep] = useState(0);

//   const initialRegion = {
//     latitude: 18.0731,
//     longitude: -15.9582,
//     latitudeDelta: 0.01,
//     longitudeDelta: 0.01,
//   };
//   const [mapCenter, setMapCenter] = useState(initialRegion);

//   useEffect(() => {
//     if (!landmark) return;
//     setTitle(landmark.title || '');
//     setDescription(landmark.description || '');
//     setArea(String(landmark.area ?? ''));
//     setPrice(String(landmark.price ?? ''));
//     setLandType(landmark.land_type || '');
//     setLots(landmark.lots != null ? String(landmark.lots) : '');
//     setDistrict(landmark.district || '');
//     setRegion(landmark.region || '');
//     setZoning(landmark.zoning || '');
//     setPlotNumber(landmark.plot_number || '');
//     setElevation(landmark.elevation_m != null ? String(landmark.elevation_m) : '');
//     setSides(Array.isArray(landmark.sides) ? landmark.sides.join(' ') : '');
//     setAreaUnit(landmark.area_unit || 'm²');
//     setHostPrivateNote(landmark.host_private_note || landmark.hostPrivateNote || '');
//     if (Array.isArray(landmark.paper_types)) {
//       setPaperTypes(landmark.paper_types.map((p: string) => normalizePaperType(p)));
//     }
//     const imgs = Array.isArray(landmark.images) ? landmark.images.filter(Boolean) : [];
//     setLandmarkImages(imgs);
//     if (landmark.point1_lat != null && landmark.point1_lng != null &&
//         landmark.point2_lat != null && landmark.point2_lng != null &&
//         landmark.point3_lat != null && landmark.point3_lng != null &&
//         landmark.point4_lat != null && landmark.point4_lng != null) {
//       setHighlightLocation(true);
//       setPoints([
//         { latitude: landmark.point1_lat, longitude: landmark.point1_lng },
//         { latitude: landmark.point2_lat, longitude: landmark.point2_lng },
//         { latitude: landmark.point3_lat, longitude: landmark.point3_lng },
//         { latitude: landmark.point4_lat, longitude: landmark.point4_lng },
//       ]);
//     }
//   }, [landmark]);

//   const { data: citiesData = [] } = useQuery({
//     queryKey: ['cities', currentLanguage || 'en'],
//     queryFn: async () => {
//       if (!endpoints?.baseURL) return [];
//       try {
//         const r = await axios.get(`${endpoints.baseURL}/cities`, { timeout: 10000 });
//         return r.data?.data || [];
//       } catch { return []; }
//     },
//     retry: 1,
//     staleTime: 5 * 60 * 1000,
//     enabled: !!endpoints?.baseURL,
//   });

//   const { data: zonesData = [] } = useQuery({
//     queryKey: ['zones', selectedCityId, currentLanguage || 'en'],
//     queryFn: async () => {
//       if (!selectedCityId || !endpoints?.baseURL) return [];
//       try {
//         const r = await axios.get(`${endpoints.baseURL}/cities/${selectedCityId}/zones`, { timeout: 10000 });
//         return r.data?.data || [];
//       } catch { return []; }
//     },
//     enabled: !!selectedCityId && !!endpoints?.baseURL,
//     retry: 1,
//     staleTime: 5 * 60 * 1000,
//   });

//   const { data: quartiersData = [] } = useQuery({
//     queryKey: ['quartiers', selectedZoneId, currentLanguage || 'en'],
//     queryFn: async () => {
//       if (!selectedZoneId || !endpoints?.baseURL) return [];
//       try {
//         const r = await axios.get(`${endpoints.baseURL}/cities/zones/${selectedZoneId}/quartiers`, { timeout: 10000 });
//         return r.data?.data || [];
//       } catch { return []; }
//     },
//     enabled: !!selectedZoneId && !!endpoints?.baseURL,
//     retry: 1,
//     staleTime: 5 * 60 * 1000,
//   });

//   const handleMapPress = (event: any) => {
//     const { latitude, longitude } = event.nativeEvent.coordinate;
//     if (points.length < 4) setPoints([...points, { latitude, longitude }]);
//   };

//   const handleMapRegionChange = (region: any) => {
//     setMapCenter({ latitude: region.latitude, longitude: region.longitude });
//   };

//   const getBase64 = async (uri: string): Promise<string> => {
//     try {
//       const Encoding: any = (FileSystem as any).EncodingType;
//       const token = Encoding?.Base64 ? Encoding.Base64 : 'base64';
//       return await FileSystem.readAsStringAsync(uri, { encoding: token });
//     } catch {
//       return await FileSystem.readAsStringAsync(uri as any);
//     }
//   };

//   const uploadImageToServer = async (imageUri: string): Promise<string> => {
//     let dataUrl = imageUri;
//     if (!/^data:image\//i.test(imageUri)) {
//       const base64 = await getBase64(imageUri);
//       dataUrl = `data:image/jpeg;base64,${base64}`;
//     }
//     const response = await axios.post(endpoints.uploadImage, { data: dataUrl }, {
//       headers: user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : undefined,
//       timeout: 120000,
//       maxContentLength: Infinity as any,
//       maxBodyLength: Infinity as any,
//     });
//     if (!response.data?.url) throw new Error('Image upload failed');
//     return response.data.url;
//   };

//   const pickLandmarkImage = async () => {
//     if (!user?.accessToken) { Alert.alert('Error', 'Please sign in.'); return; }
//     setIsUploadingImage(true);
//     try {
//       const result = await pickImageNative({ allowsEditing: true, aspect: [4, 3], quality: 0.8, base64: true });
//       if (!result.canceled && result.assets?.length) {
//         const asset = result.assets[0];
//         const uri = (asset as any).uri || '';
//         const base64 = (asset as any).base64;
//         let dataUrl: string;
//         if (base64 && typeof base64 === 'string' && base64.length) {
//           dataUrl = `data:image/jpeg;base64,${base64}`;
//         } else {
//           dataUrl = `data:image/jpeg;base64,${await getBase64(uri)}`;
//         }
//         const serverUrl = await uploadImageToServer(dataUrl);
//         setLandmarkImages((prev) => [...prev, serverUrl]);
//       }
//     } catch (e: any) {
//       Alert.alert('Error', e?.message || 'Upload failed');
//     } finally {
//       setIsUploadingImage(false);
//     }
//   };

//   const removeLandmarkImage = (index: number) => setLandmarkImages((prev) => prev.filter((_, i) => i !== index));

//   const pickLandmarkVideo = async () => {
//     try {
//       const result = await pickVideoNative({ allowsEditing: false, quality: 0.8 });
//       if (!result.canceled && result.assets?.length) {
//         const asset = result.assets[0];
//         const uri = (asset as any).uri || '';
//         if (uri) setLandmarkVideo({ uri, mimeType: (asset as any).mimeType });
//       }
//     } catch {
//       Alert.alert('Error', 'Failed to pick video.');
//     }
//   };

//   const removeLandmarkVideo = () => setLandmarkVideo(null);

//   const handleSubmit = async () => {
//     if (!user?.accessToken) { Alert.alert('Error', 'You must be logged in.'); return; }
//     setIsSubmitting(true);
//     try {
//       const coordinates = points.length === 4 ? points : [];
//       const [p1, p2, p3, p4] = coordinates;

//       let uploadedVideoUrl: string | null = null;
//       if (landmarkVideo?.uri) {
//         const base64 = await getBase64(landmarkVideo.uri);
//         const resp = await axios.post(endpoints.uploadVideo, {
//           data: `data:${landmarkVideo.mimeType || 'video/mp4'};base64,${base64}`,
//           mime: landmarkVideo.mimeType || 'video/mp4',
//         }, { headers: { Authorization: `Bearer ${user.accessToken}` }, timeout: 120000 });
//         if (resp.data?.url) uploadedVideoUrl = resp.data.url;
//       }
//       const videoUrl = uploadedVideoUrl ?? landmark?.video_url ?? null;

//       const payload = {
//         title: title.trim(),
//         description: description.trim(),
//         images: landmarkImages,
//         ...(videoUrl && { video_url: videoUrl }),
//         area: parseFloat(area) || 0,
//         area_unit: areaUnit,
//         land_type: landType,
//         zoning: zoning,
//         lots: lots.trim().length ? parseInt(lots, 10) : undefined,
//         district: district.trim(),
//         region: region.trim(),
//         plot_number: plotNumber.trim(),
//         elevation_m: parseFloat(elevation) || 0,
//         sides: sides.split(/\s+/).filter(Boolean),
//         paper_types: Array.from(
//           new Set([
//             ...paperTypes,
//             ...(customPaperType.trim() ? [customPaperType.trim()] : []),
//           ])
//         ),
//         price: parseFloat(price) || 0,
//         currency: 'MRU',
//         utilities: [],
//         highlight_location: highlightLocation,
//         ...(highlightLocation && points.length === 4 ? {
//           point1_lat: p1.latitude, point1_lng: p1.longitude,
//           point2_lat: p2.latitude, point2_lng: p2.longitude,
//           point3_lat: p3.latitude, point3_lng: p3.longitude,
//           point4_lat: p4.latitude, point4_lng: p4.longitude,
//         } : {}),
//         property_papers: [],
//         ...(hostPrivateNote.trim()
//           ? { host_private_note: hostPrivateNote.trim() }
//           : { host_private_note: "" }),
//       };

//       await axios.patch(`${endpoints.baseURL}/landmarks/${landmark.id}`, payload, {
//         headers: { Authorization: `Bearer ${user.accessToken}`, 'Content-Type': 'application/json' },
//       });

//       queryClient.invalidateQueries({ queryKey: ['user-landmarks'] }).catch(() => {});
//       Alert.alert('Success', 'Landmark updated successfully!', [
//         { text: 'OK', onPress: () => navigation.goBack() },
//       ]);
//     } catch (error: any) {
//       Alert.alert('Error', error.response?.data?.error || 'Failed to update.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const LAND_TYPES = [
//     { key: 'residential', label: 'Residential', icon: 'home' },
//     { key: 'commercial', label: 'Commercial', icon: 'store' },
//     { key: 'agricultural', label: 'Agricultural', icon: 'agriculture' },
//     { key: 'industrial', label: 'Industrial', icon: 'factory' },
//     { key: 'mixed', label: 'Mixed Use', icon: 'business' },
//     { key: 'other', label: 'Other', icon: 'more-horiz' },
//   ];

//   const STEPS = [
//     { id: 'title', title: 'Edit title', subtitle: 'Clear, descriptive title', validation: () => title.trim().length > 0, render: () => (
//       <View style={styles.focusedInputContainer}>
//         <TextInput style={styles.focusedInput} value={title} onChangeText={setTitle} placeholder="e.g., Prime Commercial Land" placeholderTextColor="#B0B0B0" />
//       </View>
//     )},
//     { id: 'description', title: 'Edit description', subtitle: 'What should buyers know?', validation: () => true, render: () => (
//       <View style={styles.focusedInputContainer}>
//         <TextInput style={[styles.focusedInput, styles.focusedTextArea]} value={description} onChangeText={setDescription} placeholder="Describe the land..." placeholderTextColor="#B0B0B0" multiline numberOfLines={6} textAlignVertical="top" />
//       </View>
//     )},
//     { id: 'area', title: 'Edit area', subtitle: 'Area in m²', validation: () => area.trim().length > 0 && parseFloat(area) > 0, render: () => (
//       <View style={styles.focusedInputContainer}>
//         <View style={styles.inputWithUnit}>
//           <TextInput style={styles.focusedInputWithUnit} value={area} onChangeText={setArea} placeholder="1000" placeholderTextColor="#B0B0B0" keyboardType="numeric" />
//           <Text style={styles.unitLabel}>m²</Text>
//         </View>
//       </View>
//     )},
//     { id: 'price', title: 'Edit price', subtitle: 'Asking price in MRU', validation: () => price.trim().length > 0 && parseFloat(price) > 0, render: () => (
//       <View style={styles.focusedInputContainer}>
//         <View style={styles.inputWithUnit}>
//           <TextInput style={styles.focusedInputWithUnit} value={price} onChangeText={setPrice} placeholder="5000000" placeholderTextColor="#B0B0B0" keyboardType="numeric" />
//           <Text style={styles.unitLabel}>MRU</Text>
//         </View>
//       </View>
//     )},
//     { id: 'landType', title: 'Edit land type', subtitle: 'Type of land', validation: () => true, render: () => (
//       <View style={styles.optionsContainer}>
//         {LAND_TYPES.map((opt) => {
//           const active = landType === opt.key;
//           return (
//             <TouchableOpacity key={opt.key} style={[styles.optionCard, active && styles.optionCardActive]} onPress={() => setLandType(active ? '' : opt.key)}>
//               <MaterialIcons name={opt.icon as any} size={32} color={active ? '#D16024' : '#717171'} />
//               <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt.label}</Text>
//               {active && <View style={styles.checkMark}><MaterialIcons name="check" size={16} color="#FFF" /></View>}
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     )},
//     { id: 'papers', title: t('listing.landmark.steps.papers.title', 'Property papers'), subtitle: t('listing.landmark.steps.papers.subtitle', 'Select available legal papers to improve trust and reduce fraud'), validation: () => true, render: () => (
//       <View style={styles.optionsContainer}>
//         <View style={styles.chipsWrap}>
//           {PAPER_TYPE_OPTIONS.map((paper) => {
//             const active = paperTypes.includes(paper);
//             return (
//               <TouchableOpacity
//                 key={paper}
//                 style={[styles.chip, active && styles.chipActive]}
//                 onPress={() =>
//                   setPaperTypes((prev) =>
//                     prev.includes(paper)
//                       ? prev.filter((p) => p !== paper)
//                       : [...prev, paper]
//                   )
//                 }
//               >
//                 <Text style={[styles.chipText, active && styles.chipTextActive]}>
//                   {getPaperTypeLabel(paper)}
//                 </Text>
//               </TouchableOpacity>
//             );
//           })}
//         </View>
//         <TextInput
//           style={styles.paperInput}
//           value={customPaperType}
//           onChangeText={setCustomPaperType}
//           placeholder={t('listing.landmark.steps.papers.otherPlaceholder', 'Add another paper title (optional)')}
//           placeholderTextColor="#999"
//         />
//       </View>
//     )},
//     { id: 'photos', title: 'Edit photos & video', subtitle: 'Add or remove media', validation: () => landmarkImages.length > 0 || !!landmarkVideo || !!(landmark && landmark.video_url), render: () => (
//       <View style={styles.photosContainer}>
//         <View style={styles.photoGrid}>
//           {landmarkImages.map((img, i) => (
//             <View key={i} style={styles.photoItem}>
//               <Image source={{ uri: img }} style={styles.photoImage} />
//               <TouchableOpacity style={styles.photoRemove} onPress={() => removeLandmarkImage(i)}>
//                 <MaterialIcons name="close" size={18} color="#FFF" />
//               </TouchableOpacity>
//             </View>
//           ))}
//           {landmarkImages.length < 10 && (
//             <TouchableOpacity style={styles.photoAddMore} onPress={pickLandmarkImage} disabled={isUploadingImage}>
//               {isUploadingImage ? <ActivityIndicator size="small" color="#717171" /> : <MaterialIcons name="add" size={32} color="#717171" />}
//             </TouchableOpacity>
//           )}
//           {!landmarkVideo && (
//             <TouchableOpacity style={styles.photoAddMore} onPress={pickLandmarkVideo}>
//               <MaterialIcons name="videocam" size={32} color="#717171" />
//             </TouchableOpacity>
//           )}
//         </View>
//         {landmarkVideo && (
//           <View style={[styles.photoItem, { marginTop: 12 }]}>
//             <View style={[styles.photoImage, { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }]}>
//               <MaterialIcons name="videocam" size={48} color="#FFF" />
//             </View>
//             <TouchableOpacity style={styles.photoRemove} onPress={removeLandmarkVideo}>
//               <MaterialIcons name="close" size={18} color="#FFF" />
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>
//     )},
//     { id: 'map', title: 'Edit location on map', subtitle: 'Optional', validation: () => !highlightLocation || points.length === 4, render: () => (
//       <View style={styles.mapStepContainer}>
//         <View style={styles.toggleContainer}>
//           <TouchableOpacity style={[styles.toggleOption, highlightLocation && styles.toggleOptionActive]} onPress={() => setHighlightLocation(true)}>
//             <MaterialIcons name="location-on" size={32} color={highlightLocation ? '#D16024' : '#717171'} />
//             <Text style={[styles.toggleOptionText, highlightLocation && styles.toggleOptionTextActive]}>Yes, show on map</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={[styles.toggleOption, !highlightLocation && styles.toggleOptionActive]} onPress={() => { setHighlightLocation(false); setPoints([]); }}>
//             <MaterialIcons name="location-off" size={32} color={!highlightLocation ? '#D16024' : '#717171'} />
//             <Text style={[styles.toggleOptionText, !highlightLocation && styles.toggleOptionTextActive]}>No</Text>
//           </TouchableOpacity>
//         </View>
//         {highlightLocation && (
//           <>
//             <View style={styles.mapContainer}>
//               <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion} onPress={handleMapPress} onRegionChange={handleMapRegionChange} showsUserLocation mapType="satellite">
//                 {points.map((p, i) => (
//                   <Marker key={i} coordinate={p}>
//                     <View style={styles.cornerMarker}><Text style={styles.cornerMarkerText}>{i + 1}</Text></View>
//                   </Marker>
//                 ))}
//               </MapView>
//               <TouchableOpacity style={styles.resetButton} onPress={() => setPoints([])}>
//                 <MaterialIcons name="refresh" size={20} color="#D16024" />
//                 <Text style={styles.resetButtonText}>Reset</Text>
//               </TouchableOpacity>
//             </View>
//           </>
//         )}
//       </View>
//     )},
//     { id: 'review', title: 'Review & save', subtitle: 'Verify your changes', validation: () => true, render: () => (
//       <View style={styles.reviewContainer}>
//         <View style={styles.reviewSection}><Text style={styles.reviewLabel}>Title</Text><Text style={styles.reviewValue}>{title || 'Not set'}</Text></View>
//         <View style={styles.reviewSection}><Text style={styles.reviewLabel}>Area</Text><Text style={styles.reviewValue}>{area ? `${area} m²` : 'Not set'}</Text></View>
//         <View style={styles.reviewSection}><Text style={styles.reviewLabel}>Price</Text><Text style={styles.reviewValue}>{price ? `${price} MRU` : 'Not set'}</Text></View>
//         <View style={styles.reviewSection}>
//           <Text style={styles.reviewLabel}>{t('listing.landmark.steps.review.papersLabel', 'Property papers')}</Text>
//           <Text style={styles.reviewValue}>
//             {[...paperTypes, customPaperType.trim()].filter(Boolean).map((p) => getPaperTypeLabel(p)).join(', ') || t('listing.common.notSet', 'Not set')}
//           </Text>
//         </View>
//         <View style={styles.reviewSection}><Text style={styles.reviewLabel}>Photos</Text><Text style={styles.reviewValue}>{landmarkImages.length} photo(s)</Text></View>
//         <View style={styles.reviewSection}>
//           <Text style={styles.reviewLabel}>Private note (only you & your org)</Text>
//           <Text style={styles.reviewHint}>Not shown to guests. Optional reminder for this listing.</Text>
//           <TextInput
//             style={styles.privateNoteInput}
//             placeholder="Internal notes, reminders..."
//             placeholderTextColor="#999"
//             multiline
//             maxLength={2000}
//             value={hostPrivateNote}
//             onChangeText={setHostPrivateNote}
//           />
//         </View>
//       </View>
//     )},
//   ];

//   const currentStepData = STEPS[currentStep];
//   const progress = ((currentStep + 1) / STEPS.length) * 100;
//   const isLastStep = currentStep === STEPS.length - 1;
//   const canProceed = currentStepData.validation();

//   if (!landmark?.id) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
//         <Text style={{ fontSize: 16, color: '#666' }}>Invalid landmark</Text>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
//           <Text style={{ color: '#D16024', fontSize: 16 }}>Go back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
//           <MaterialIcons name="close" size={28} color="#222" />
//         </TouchableOpacity>
//         <Text style={{ fontSize: 18, fontWeight: '600', color: '#222', marginBottom: 8 }}>Edit Landmark</Text>
//         <View style={styles.progressBar}>
//           <View style={[styles.progressFill, { width: `${progress}%` }]} />
//         </View>
//       </View>

//       <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
//         <View style={styles.stepContent}>
//           <Text style={styles.stepTitle}>{currentStepData.title}</Text>
//           {currentStepData.subtitle && <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>}
//           <View style={styles.stepBody}>{currentStepData.render()}</View>
//         </View>
//       </ScrollView>

//       <View style={styles.footer}>
//         <View style={styles.footerContent}>
//           {currentStep > 0 && (
//             <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep((s) => s - 1)}>
//               <MaterialIcons name="arrow-back" size={24} color="#222" />
//               <Text style={styles.backButtonText}>Back</Text>
//             </TouchableOpacity>
//           )}
//           <View style={{ flex: 1 }} />
//           {isLastStep ? (
//             <TouchableOpacity style={[styles.nextButton, isSubmitting && styles.nextButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
//               {isSubmitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.nextButtonText}>Save</Text>}
//             </TouchableOpacity>
//           ) : (
//             <TouchableOpacity style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]} onPress={() => setCurrentStep((s) => s + 1)} disabled={!canProceed}>
//               <Text style={styles.nextButtonText}>Next</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  StyleSheet,
} from "react-native";
import { pickImageNative, pickVideoNative } from "../utils/nativePhotoPicker";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";
import { endpoints } from "../constants";
import { useUser } from "../hooks/useUser";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import { theme } from "../theme";
import { uploadVideoChunked } from "../services/videoChunkUpload";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CORAL = theme["color-temporary-primary"];
const INK = "#222222";
const SLATE = "#717171";
const MIST = "#B0B0B0";
const BORDER = "#F0F0F0";

const LAND_TYPES = [
  { key: "residential", labelKey: "editLandmark.landTypes.residential" },
  { key: "commercial", labelKey: "editLandmark.landTypes.commercial" },
  { key: "agricultural", labelKey: "editLandmark.landTypes.agricultural" },
  { key: "industrial", labelKey: "editLandmark.landTypes.industrial" },
  { key: "mixed", labelKey: "editLandmark.landTypes.mixed" },
  { key: "other", labelKey: "editLandmark.landTypes.other" },
];

const PAPER_TYPES = [
  "titre_foncier",
  "quitane",
  "lettre",
  "concession",
  "bornage",
];

type SectionId =
  | "title"
  | "description"
  | "pricing"
  | "landType"
  | "papers"
  | "photos"
  | "map"
  | "note";

/** Normalize images from API (array or JSON string). */
function parseLandmarkImageUrls(images: unknown): string[] {
  if (!images) return [];
  if (Array.isArray(images)) {
    return images.filter((u): u is string => typeof u === "string" && !!u.trim());
  }
  if (typeof images === "string") {
    const t = images.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (u): u is string => typeof u === "string" && !!u.trim(),
        );
      }
    } catch {
      if (t.startsWith("http")) return [t];
    }
  }
  return [];
}

/** Normalize property paper URLs from API (array or JSON string). */
function parseLandmarkPropertyPapers(papers: unknown): string[] {
  if (!papers) return [];
  if (Array.isArray(papers)) {
    return papers.filter((u): u is string => typeof u === "string" && !!u.trim());
  }
  if (typeof papers === "string") {
    const t = papers.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (u): u is string => typeof u === "string" && !!u.trim(),
        );
      }
    } catch {
      if (t.startsWith("http")) return [t];
    }
  }
  return [];
}

export const EditLandmarkScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const mapRef = useRef<MapView>(null);
  const { t } = useTranslation();
  const landmark = route.params?.landmark;
  const landmarkId = Number(landmark?.id ?? landmark?.ID ?? 0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [landType, setLandType] = useState("");
  const [zoning, setZoning] = useState("");
  const [lots, setLots] = useState("");
  const [plotNumber, setPlotNumber] = useState("");
  const [elevation, setElevation] = useState("");
  const [sides, setSides] = useState("");
  const [paperTypes, setPaperTypes] = useState<string[]>([]);
  const [customPaper, setCustomPaper] = useState("");
  const [paperUploads, setPaperUploads] = useState<string[]>([]);
  const [isUploadingPapers, setIsUploadingPapers] = useState(false);
  const [landmarkImages, setLandmarkImages] = useState<string[]>([]);
  const [landmarkVideo, setLandmarkVideo] = useState<{
    uri: string;
    mimeType?: string;
  } | null>(null);
  const [hostPrivateNote, setHostPrivateNote] = useState("");
  const [highlightLoc, setHighlightLoc] = useState(false);
  const [points, setPoints] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  const initialRegion = {
    latitude: 18.0731,
    longitude: -15.9582,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  useEffect(() => {
    if (!landmark) return;
    setTitle(landmark.title || "");
    setDescription(landmark.description || "");
    setArea(String(landmark.area ?? ""));
    setPrice(String(landmark.price ?? ""));
    setLandType(landmark.land_type || "");
    setZoning(landmark.zoning || "");
    setLots(landmark.lots != null ? String(landmark.lots) : "");
    setPlotNumber(landmark.plot_number || "");
    setElevation(
      landmark.elevation_m != null ? String(landmark.elevation_m) : "",
    );
    setSides(Array.isArray(landmark.sides) ? landmark.sides.join(" ") : "");
    setHostPrivateNote(landmark.host_private_note || "");
    if (Array.isArray(landmark.paper_types))
      setPaperTypes(landmark.paper_types);
    setPaperUploads(parseLandmarkPropertyPapers(landmark.property_papers));
    setLandmarkImages(
      parseLandmarkImageUrls(landmark.images),
    );
    if (landmark.point1_lat != null && landmark.point4_lat != null) {
      setHighlightLoc(true);
      setPoints([
        { latitude: landmark.point1_lat, longitude: landmark.point1_lng },
        { latitude: landmark.point2_lat, longitude: landmark.point2_lng },
        { latitude: landmark.point3_lat, longitude: landmark.point3_lng },
        { latitude: landmark.point4_lat, longitude: landmark.point4_lng },
      ]);
    }
  }, [landmark]);

  const paperLabel = (p: string) => t(`listing.common.paperTypes.${p}`, p);

  const toggle = (id: SectionId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const getBase64 = async (uri: string) => {
    const Enc: any = (FileSystem as any).EncodingType;
    return FileSystem.readAsStringAsync(uri, {
      encoding: Enc?.Base64 || "base64",
    });
  };

  const pickPhoto = async () => {
    if (!user?.accessToken) return;
    setUploadingImg(true);
    try {
      const r = await pickImageNative({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      if (!r.canceled && r.assets?.length) {
        const a = r.assets[0];
        const uri = (a as any).uri || "";
        let dataUrl: string;
        const rawB64 = (a as any).base64;
        if (rawB64 && typeof rawB64 === "string") {
          dataUrl = rawB64.startsWith("data:")
            ? rawB64
            : `data:image/jpeg;base64,${rawB64}`;
        } else {
          dataUrl = `data:image/jpeg;base64,${await getBase64(uri)}`;
        }
        const res = await axios.post(
          endpoints.uploadImage,
          { data: dataUrl },
          {
            headers: { Authorization: `Bearer ${user.accessToken}` },
            timeout: 120000,
          },
        );
        if (res.data?.url) setLandmarkImages((p) => [...p, res.data.url]);
      }
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message);
    } finally {
      setUploadingImg(false);
    }
  };

  const pickPaperUpload = async (replaceIndex?: number) => {
    if (!user?.accessToken) {
      Alert.alert(
        t("listing.landmark.alerts.error", "Error"),
        t(
          "listing.landmark.alerts.signInToUpload",
          "Please sign in to upload papers.",
        ),
      );
      return;
    }
    setIsUploadingPapers(true);
    try {
      const r = await pickImageNative({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
        base64: true,
      });
      if (r.canceled || !r.assets?.length) return;
      const a = r.assets[0] as any;
      const uri = a?.uri || "";
      let dataUrl: string;
      const rawB64 = a?.base64;
      if (rawB64 && typeof rawB64 === "string") {
        dataUrl = rawB64.startsWith("data:")
          ? rawB64
          : `data:image/jpeg;base64,${rawB64}`;
      } else {
        dataUrl = `data:image/jpeg;base64,${await getBase64(uri)}`;
      }
      const res = await axios.post(
        endpoints.uploadImage,
        { data: dataUrl },
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
          timeout: 120000,
        },
      );
      const serverUrl = res.data?.url;
      if (!serverUrl) return;
      if (replaceIndex !== undefined) {
        setPaperUploads((prev) =>
          prev.map((url, i) => (i === replaceIndex ? serverUrl : url)),
        );
      } else {
        setPaperUploads((prev) => [...prev, serverUrl]);
      }
    } catch (e: any) {
      Alert.alert(
        t("listing.landmark.alerts.error", "Error"),
        String(
          e?.response?.data?.error ||
            e?.message ||
            t("listing.landmark.alerts.uploadFailed", "Upload failed"),
        ),
      );
    } finally {
      setIsUploadingPapers(false);
    }
  };

  const removePaperUpload = (index: number) => {
    setPaperUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const pickVideo = async () => {
    try {
      const r = await pickVideoNative({ allowsEditing: false, quality: 0.8 });
      if (!r.canceled && r.assets?.length) {
        const a = r.assets[0];
        setLandmarkVideo({
          uri: (a as any).uri,
          mimeType: (a as any).mimeType,
        });
      }
    } catch {
      Alert.alert("Error", "Could not pick video.");
    }
  };

  const handleSubmit = async () => {
    if (!user?.accessToken) {
      Alert.alert("Error", "Please sign in.");
      return;
    }
    if (!landmarkId) {
      Alert.alert("Error", "Landmark not found.");
      return;
    }
    setIsSubmitting(true);
    try {
      let videoUrl = landmark?.video_url ?? null;
      if (landmarkVideo?.uri) {
        videoUrl = await uploadVideoChunked(
          landmarkVideo.uri,
          landmarkVideo.mimeType || "video/mp4",
          user.accessToken,
        );
      }
      const mapPayload =
        highlightLoc && points.length === 4
          ? (() => {
              const [p1, p2, p3, p4] = points;
              return {
                highlight_location: true,
                point1_lat: p1.latitude,
                point1_lng: p1.longitude,
                point2_lat: p2.latitude,
                point2_lng: p2.longitude,
                point3_lat: p3.latitude,
                point3_lng: p3.longitude,
                point4_lat: p4.latitude,
                point4_lng: p4.longitude,
              };
            })()
          : !highlightLoc
            ? { highlight_location: false }
            : {};

      await axios.patch(
        `${endpoints.baseURL}/landmarks/${landmarkId}`,
        {
          title: title.trim(),
          description: description.trim(),
          images: landmarkImages.filter(
            (u) => typeof u === "string" && u.trim().length > 0,
          ),
          ...(videoUrl ? { video_url: videoUrl } : {}),
          area: parseFloat(area) || 0,
          area_unit: "m²",
          land_type: landType,
          zoning,
          lots: lots ? parseInt(lots) : undefined,
          plot_number: plotNumber.trim(),
          elevation_m: parseFloat(elevation) || 0,
          sides: sides.split(/\s+/).filter(Boolean),
          paper_types: [
            ...new Set([
              ...paperTypes,
              ...(customPaper.trim() ? [customPaper.trim()] : []),
            ]),
          ],
          price: parseFloat(price) || 0,
          currency: "MRU",
          ...mapPayload,
          host_private_note: hostPrivateNote.trim(),
          utilities: [],
          property_papers: paperUploads.filter(
            (u) => typeof u === "string" && u.trim().length > 0,
          ),
        },
        { headers: { Authorization: `Bearer ${user.accessToken}` } },
      );

      queryClient
        .invalidateQueries({ queryKey: ["user-landmarks"] })
        .catch(() => {});
      Alert.alert(
        t("editLandmark.alerts.saved", "Saved"),
        t("editLandmark.alerts.savedBody", "Your listing has been updated."),
        [{ text: t("editLandmark.alerts.ok", "OK"), onPress: () => navigation.goBack() }],
      );
    } catch (e: any) {
      Alert.alert(
        t("editLandmark.alerts.error", "Error"),
        e.response?.data?.error ||
          t("editLandmark.alerts.updateFailed", "Update failed. Try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Preview helpers ─────────────────────────────────────────────────────
  const notSet = t("editLandmark.preview.notSet", "Not set");

  const previews: Record<SectionId, string> = {
    title: title.trim() || notSet,
    description: description.trim()
      ? description.slice(0, 55) + (description.length > 55 ? "…" : "")
      : notSet,
    pricing:
      [
        area && `${area} m²`,
        price && `${parseFloat(price).toLocaleString()} MRU`,
      ]
        .filter(Boolean)
        .join("  ·  ") || notSet,
    landType:
      t(
        `editLandmark.landTypes.${landType}`,
        landType || notSet,
      ) || notSet,
    papers:
      [
        paperTypes.length ? paperTypes.map(paperLabel).join(", ") : null,
        paperUploads.length
          ? t("editLandmark.preview.filesUploaded", {
              count: paperUploads.length,
              defaultValue: "{{count}} file uploaded",
            })
          : null,
      ]
        .filter(Boolean)
        .join("  ·  ") || t("editLandmark.preview.none", "None"),
    photos:
      [
        landmarkImages.length &&
          t("editLandmark.preview.photos", {
            count: landmarkImages.length,
            defaultValue: "{{count}} photo",
          }),
        (landmarkVideo || landmark?.video_url) &&
          t("editLandmark.preview.video", "video"),
      ]
        .filter(Boolean)
        .join("  ·  ") || t("editLandmark.preview.noMedia", "No media"),
    map:
      highlightLoc && points.length === 4
        ? t("editLandmark.preview.locationPinned", "Location pinned")
        : t("editLandmark.preview.notShown", "Not shown"),
    note: hostPrivateNote.trim()
      ? hostPrivateNote.slice(0, 50) + "…"
      : t("editLandmark.preview.noNote", "No note"),
  };

  const ROWS: { id: SectionId; labelKey: string }[] = [
    { id: "title", labelKey: "editLandmark.sections.title" },
    { id: "description", labelKey: "editLandmark.sections.description" },
    { id: "pricing", labelKey: "editLandmark.sections.pricing" },
    { id: "landType", labelKey: "editLandmark.sections.landType" },
    { id: "papers", labelKey: "editLandmark.sections.papers" },
    { id: "photos", labelKey: "editLandmark.sections.photos" },
    { id: "map", labelKey: "editLandmark.sections.map" },
    { id: "note", labelKey: "editLandmark.sections.note" },
  ];

  if (!landmarkId)
    return (
      <View style={S.center}>
        <Text style={S.errorText}>
          {t("editLandmark.notFound", "Landmark not found")}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={S.link}>
            ← {t("editLandmark.goBack", "Go back")}
          </Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={S.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={INK} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>
          {t("editLandmark.title", "Edit listing")}
        </Text>
        <TouchableOpacity
          style={[S.saveBtn, isSubmitting && S.saveBtnOff]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={S.saveBtnText}>
              {t("editLandmark.save", "Save")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section rows */}
        <View style={S.list}>
          {ROWS.map((row, i) => {
            const isOpen = openSection === row.id;
            const isLast = i === ROWS.length - 1;
            return (
              <View key={row.id}>
                {/* Row */}
                <TouchableOpacity
                  style={S.row}
                  onPress={() => toggle(row.id)}
                  activeOpacity={0.6}
                >
                  <View style={S.rowLeft}>
                    <Text style={[S.rowLabel, isOpen && S.rowLabelOpen]}>
                      {t(row.labelKey, row.id)}
                    </Text>
                    {!isOpen && (
                      <Text style={S.rowValue} numberOfLines={1}>
                        {previews[row.id]}
                      </Text>
                    )}
                  </View>
                  <MaterialIcons
                    name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-right"}
                    size={20}
                    color={isOpen ? CORAL : MIST}
                  />
                </TouchableOpacity>

                {/* Expanded editor */}
                {isOpen && <View style={S.editor}>{renderEditor(row.id)}</View>}

                {!isLast && <View style={S.divider} />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ── Editors ──────────────────────────────────────────────────────────────
  function renderEditor(id: SectionId) {
    switch (id) {
      case "title":
        return (
          <TextInput
            style={S.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t(
              "editLandmark.placeholders.title",
              "e.g. Prime land near main road",
            )}
            placeholderTextColor={MIST}
            autoFocus
          />
        );

      case "description":
        return (
          <TextInput
            style={[S.input, S.inputMulti]}
            value={description}
            onChangeText={setDescription}
            placeholder={t(
              "editLandmark.placeholders.description",
              "Describe the land, access, nearby landmarks…",
            )}
            placeholderTextColor={MIST}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        );

      case "pricing":
        return (
          <View style={S.editorGap}>
            <View style={S.unitRow}>
              <TextInput
                style={[S.input, S.inputFlex]}
                value={area}
                onChangeText={setArea}
                placeholder={t("editLandmark.placeholders.area", "Area")}
                placeholderTextColor={MIST}
                keyboardType="numeric"
              />
              <Text style={S.unit}>m²</Text>
            </View>
            <View style={S.unitRow}>
              <TextInput
                style={[S.input, S.inputFlex]}
                value={price}
                onChangeText={setPrice}
                placeholder={t("editLandmark.placeholders.price", "Price")}
                placeholderTextColor={MIST}
                keyboardType="numeric"
              />
              <Text style={S.unit}>MRU</Text>
            </View>
            <TextInput
              style={S.input}
              value={lots}
              onChangeText={setLots}
              placeholder={t("editLandmark.placeholders.lots", "Lots (optional)")}
              placeholderTextColor={MIST}
              keyboardType="numeric"
            />
          </View>
        );

      case "landType":
        return (
          <View style={S.chips}>
            {LAND_TYPES.map((opt) => {
              const on = landType === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[S.chip, on && S.chipOn]}
                  onPress={() => setLandType(on ? "" : opt.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[S.chipText, on && S.chipTextOn]}>
                    {t(opt.labelKey, opt.key)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case "papers":
        return (
          <View style={S.editorGap}>
            <Text style={S.papersHint}>
              {t(
                "listing.landmark.steps.papers.hint",
                "Select the legal papers you have for this land.",
              )}
            </Text>
            <View style={S.chips}>
              {PAPER_TYPES.map((p) => {
                const on = paperTypes.includes(p);
                return (
                  <TouchableOpacity
                    key={p}
                    style={[S.chip, on && S.chipOn]}
                    onPress={() =>
                      setPaperTypes((prev) =>
                        on ? prev.filter((x) => x !== p) : [...prev, p],
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={[S.chipText, on && S.chipTextOn]}>
                      {paperLabel(p)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={S.input}
              value={customPaper}
              onChangeText={setCustomPaper}
              placeholder={t(
                "listing.landmark.steps.papers.otherPlaceholder",
                "Add another paper title (optional)",
              )}
              placeholderTextColor={MIST}
            />
            <Text style={S.papersUploadLabel}>
              {t(
                "listing.landmark.steps.papers.addPapers",
                "Upload papers",
              )}
            </Text>
            <Text style={S.papersHint}>
              {t(
                "listing.landmark.steps.papers.cropHint",
                "Crop each document clearly — buyers trust verified listings.",
              )}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={S.thumbStrip}>
                {paperUploads.map((url, idx) => (
                  <View key={`${url}-${idx}`} style={S.thumb}>
                    <Image source={{ uri: url }} style={S.thumbImg} />
                    <TouchableOpacity
                      style={S.paperCropBtn}
                      onPress={() => pickPaperUpload(idx)}
                      disabled={isUploadingPapers}
                    >
                      <MaterialIcons name="crop" size={12} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={S.thumbX}
                      onPress={() => removePaperUpload(idx)}
                    >
                      <MaterialIcons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={S.thumbAdd}
                  onPress={() => pickPaperUpload()}
                  disabled={isUploadingPapers}
                >
                  {isUploadingPapers ? (
                    <ActivityIndicator size="small" color={MIST} />
                  ) : (
                    <MaterialIcons name="description" size={24} color={MIST} />
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        );

      case "photos":
        return (
          <View style={S.editorGap}>
            {/* Thumbnail strip */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={S.thumbStrip}>
                {landmarkImages.map((img, i) => (
                  <View key={i} style={S.thumb}>
                    <Image source={{ uri: img }} style={S.thumbImg} />
                    <TouchableOpacity
                      style={S.thumbX}
                      onPress={() =>
                        setLandmarkImages((p) => p.filter((_, j) => j !== i))
                      }
                    >
                      <MaterialIcons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {landmarkImages.length < 10 && (
                  <TouchableOpacity
                    style={S.thumbAdd}
                    onPress={pickPhoto}
                    disabled={uploadingImg}
                  >
                    {uploadingImg ? (
                      <ActivityIndicator size="small" color={MIST} />
                    ) : (
                      <MaterialIcons name="add" size={24} color={MIST} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            {/* Video row */}
            {landmarkVideo ? (
              <View style={S.videoRow}>
                <MaterialIcons name="videocam" size={18} color={SLATE} />
                <Text style={S.videoRowText}>Video added</Text>
                <TouchableOpacity
                  onPress={() => setLandmarkVideo(null)}
                  hitSlop={10}
                >
                  <MaterialIcons name="close" size={18} color={MIST} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={S.videoRow}
                onPress={pickVideo}
                activeOpacity={0.7}
              >
                <MaterialIcons name="videocam" size={18} color={CORAL} />
                <Text style={[S.videoRowText, { color: CORAL }]}>
                  Add a video tour
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case "map":
        return (
          <View style={S.editorGap}>
            {/* Toggle */}
            <View style={S.chips}>
              {[
                { val: true, label: t("editLandmark.map.show", "Show on map") },
                { val: false, label: t("editLandmark.map.hide", "Hide") },
              ].map((opt) => {
                const on = highlightLoc === opt.val;
                return (
                  <TouchableOpacity
                    key={String(opt.val)}
                    style={[S.chip, on && S.chipOn]}
                    onPress={() => {
                      setHighlightLoc(opt.val);
                      if (!opt.val) setPoints([]);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[S.chipText, on && S.chipTextOn]}>
                      {t(opt.labelKey, opt.key)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {highlightLoc && (
              <>
                <Text style={S.mapHint}>
                  Tap 4 corners of your plot on the map. {points.length}/4
                  placed.
                </Text>
                <View style={S.mapWrap}>
                  <MapView
                    ref={mapRef}
                    style={S.map}
                    initialRegion={initialRegion}
                    onPress={(e: any) => {
                      const c = e.nativeEvent.coordinate;
                      if (points.length < 4) setPoints((p) => [...p, c]);
                    }}
                    mapType="satellite"
                    showsUserLocation
                  >
                    {points.map((p, i) => (
                      <Marker key={i} coordinate={p}>
                        <View style={S.pin}>
                          <Text style={S.pinText}>{i + 1}</Text>
                        </View>
                      </Marker>
                    ))}
                  </MapView>
                  {points.length > 0 && (
                    <TouchableOpacity
                      style={S.resetBtn}
                      onPress={() => setPoints([])}
                    >
                      <Text style={S.resetBtnText}>Reset</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        );

      case "note":
        return (
          <>
            <Text style={S.noteHint}>
              Only visible to you and your organization.
            </Text>
            <TextInput
              style={[S.input, S.inputMulti]}
              value={hostPrivateNote}
              onChangeText={setHostPrivateNote}
              placeholder={t(
                "editLandmark.placeholders.note",
                "Internal reminders, follow-up notes…",
              )}
              placeholderTextColor={MIST}
              multiline
              textAlignVertical="top"
              maxLength={2000}
              autoFocus
            />
          </>
        );
    }
  }
};

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 16, color: SLATE },
  link: { fontSize: 15, color: CORAL },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 58 : 18,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: INK },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    backgroundColor: CORAL,
    borderRadius: 999,
  },
  saveBtnOff: { opacity: 0.45 },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  /* List */
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  list: {
    marginHorizontal: 20,
    marginTop: 8,
  },

  /* Row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    gap: 12,
  },
  rowLeft: { flex: 1, gap: 3 },
  rowLabel: { fontSize: 15, fontWeight: "600", color: INK },
  rowLabelOpen: { color: CORAL },
  rowValue: { fontSize: 13, color: MIST },

  divider: { height: 1, backgroundColor: BORDER },

  /* Editor */
  editor: {
    paddingBottom: 20,
  },
  editorGap: { gap: 12 },

  /* Inputs */
  input: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: INK,
    backgroundColor: "#FAFAFA",
  },
  inputMulti: { minHeight: 100, paddingTop: 13 },
  inputFlex: { flex: 1 },

  unitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  unit: { fontSize: 13, fontWeight: "600", color: MIST, minWidth: 32 },

  /* Chips */
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: "#FAFAFA",
  },
  chipOn: { borderColor: CORAL, backgroundColor: "#FFF0F2" },
  chipText: { fontSize: 13, fontWeight: "600", color: SLATE },
  chipTextOn: { color: CORAL },

  papersHint: { fontSize: 13, color: SLATE, lineHeight: 18 },
  papersUploadLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: INK,
    marginTop: 4,
  },
  paperCropBtn: {
    position: "absolute",
    bottom: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Thumb strip */
  thumbStrip: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  thumb: { width: 72, height: 72, borderRadius: 12, position: "relative" },
  thumbImg: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#EEE",
  },
  thumbX: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbAdd: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Video row */
  videoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
  },
  videoRowText: { flex: 1, fontSize: 14, fontWeight: "600", color: SLATE },

  /* Map */
  mapHint: { fontSize: 12, color: MIST, marginBottom: 4 },
  mapWrap: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    position: "relative",
  },
  map: { flex: 1 },
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CORAL,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  pinText: { fontSize: 10, fontWeight: "800", color: "#fff" },
  resetBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  resetBtnText: { fontSize: 12, fontWeight: "700", color: CORAL },

  /* Note */
  noteHint: { fontSize: 12, color: MIST, marginBottom: 10 },
});
