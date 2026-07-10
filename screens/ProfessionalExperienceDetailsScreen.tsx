// // import React, { useState, useRef } from 'react';
// // import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Dimensions, Alert, FlatList, Modal } from 'react-native';
// // import { SafeAreaView } from 'react-native-safe-area-context';
// // import { useNavigation, useRoute } from '@react-navigation/native';
// // import { 
// //   ArrowLeft, 
// //   Heart, 
// //   Share, 
// //   Star, 
// //   MapPin, 
// //   Clock, 
// //   Users, 
// //   Calendar,
// //   Shield,
// //   WifiHigh,
// //   Car,
// //   Coffee,
// //   Camera,
// //   MusicNote,
// //   ForkKnife,
// //   GameController,
// //   Check,
// //   Play,
// //   Pause
// // } from 'phosphor-react-native';
// // import { useExperienceDetails } from '../hooks/queries/useExperienceDetails';
// // import { useExperienceParticipants } from '../hooks/queries/useExperienceInvites';
// // import { useUser } from '../hooks/useUser';
// // import { ProfessionalAvailabilityCalendar } from '../components/ProfessionalAvailabilityCalendar';
// // import { SimpleVideoPlayer } from '../components/SimpleVideoPlayer';

// // const { width } = Dimensions.get('window');

// // export const ProfessionalExperienceDetailsScreen = () => {
// //   const navigation = useNavigation();
// //   const route = useRoute();
// //   const { experienceId } = route.params as { experienceId: number };
// //   const [currentImageIndex, setCurrentImageIndex] = useState(0);
// //   const [isLiked, setIsLiked] = useState(false);
// //   const [selectedDate, setSelectedDate] = useState<string>('');
// //   const [isVideoPlaying, setIsVideoPlaying] = useState(false);
// //   const [showVideoPlayer, setShowVideoPlayer] = useState(false);
// //   const [showInviteSheet, setShowInviteSheet] = useState(false);
// //   const flatListRef = useRef<FlatList>(null);
  
// //   const { data: experience, isLoading } = useExperienceDetails(experienceId);
// //   const { data: participants = [] } = useExperienceParticipants(experienceId);
// //   const { user } = useUser();

// //   if (isLoading) {
// //     return (
// //       <View style={styles.container}>
// //         <View style={styles.loadingContainer}>
// //           <Text style={styles.loadingText}>Loading experience details...</Text>
// //         </View>
// //       </View>
// //     );
// //   }

// //   if (!experience) {
// //     return (
// //       <View style={styles.container}>
// //         <View style={styles.errorContainer}>
// //           <Text style={styles.errorText}>Experience not found</Text>
// //         </View>
// //       </View>
// //     );
// //   }

// //   const e = experience;
// //   const capacityLeft = (e.capacity || e.Capacity || 0) - participants.length;
// //   const isHost = user?.ID === e.hostID || user?.ID === e.HostID;

// //   const formatPrice = (price: number) => {
// //     return `${price} MRU` ;
// //   };

// //   const formatDuration = (minutes: number) => {
// //     const hours = Math.floor(minutes / 60);
// //     const mins = minutes % 60;
// //     if (hours > 0 && mins > 0) {
// //       return `${hours}h ${mins}min`;
// //     } else if (hours > 0) {
// //       return `${hours}h`;
// //     } else {
// //       return `${mins}min`;
// //     }
// //   };

// //   const getCancellationPolicyText = (policy: string) => {
// //     switch (policy?.toLowerCase()) {
// //       case 'flexible':
// //         return 'Cancel up to 24 hours before check-in for a full refund';
// //       case 'moderate':
// //         return 'Cancel up to 5 days before check-in for a full refund';
// //       case 'strict':
// //         return 'Cancel up to 7 days before check-in for a 50% refund';
// //       default:
// //         return 'Cancellation policy varies';
// //     }
// //   };

// //   const getAmenities = () => {
// //     const amenities = [];
// //     if (e.wifi || e.Wifi) amenities.push({ icon: WifiHigh, name: 'WiFi' });
// //     if (e.parking || e.Parking) amenities.push({ icon: Car, name: 'Parking' });
// //     if (e.food || e.Food) amenities.push({ icon: ForkKnife, name: 'Food & Drinks' });
// //     if (e.photography || e.Photography) amenities.push({ icon: Camera, name: 'Photography' });
// //     if (e.music || e.Music) amenities.push({ icon: MusicNote, name: 'Music' });
// //     if (e.games || e.Games) amenities.push({ icon: GameController, name: 'Games' });
// //     return amenities;
// //   };

// //   const getMediaItems = () => {
// //     const items = [];
    
// //     // Add photos from the Photos JSON array
// //     if (e.photos || e.Photos) {
// //       try {
// //         const photos = typeof e.photos === 'string' ? JSON.parse(e.photos) : e.photos;
// //         if (Array.isArray(photos)) {
// //           photos.forEach((photo, index) => {
// //             if (photo && photo.url) {
// //               items.push({
// //                 type: 'image',
// //                 url: photo.url,
// //                 id: `photo-${index}`
// //               });
// //             }
// //           });
// //         }
// //       } catch (error) {
// //         console.log('Error parsing photos:', error);
// //       }
// //     }
    
// //     // Add video demo if available
// //     if (e.videoURL || e.VideoURL) {
// //       items.push({
// //         type: 'video',
// //         url: e.videoURL || e.VideoURL,
// //         id: 'demo-video'
// //       });
// //     }
    
// //     // If no photos, add a placeholder
// //     if (items.length === 0) {
// //       items.push({
// //         type: 'image',
// //         url: 'https://via.placeholder.com/400x300?text=No+Images+Available',
// //         id: 'placeholder-image'
// //       });
// //     }
    
// //     return items;
// //   };

// //   const handleMediaScroll = (event: any) => {
// //     const contentOffset = event.nativeEvent.contentOffset;
// //     const viewSize = event.nativeEvent.layoutMeasurement;
// //     const pageNum = Math.floor(contentOffset.x / viewSize.width);
// //     setCurrentImageIndex(pageNum);
// //   };

// //   const handleVideoPlay = () => {
// //     const videoUrl = e.videoURL || e.VideoURL;
// //     if (videoUrl) {
// //       setShowVideoPlayer(true);
// //     } else {
// //       Alert.alert('Video Demo', 'No video URL available for this experience.');
// //     }
// //   };

// //   const handleCloseVideo = () => {
// //     setShowVideoPlayer(false);
// //     setIsVideoPlaying(false);
// //   };

// //   const handleDateSelect = (date: string) => {
// //     setSelectedDate(date);
// //     Alert.alert('Date Selected', `You selected ${date}. Proceed to booking?`);
// //   };

// //   const handleInvite = () => {
// //     if (isHost) {
// //       (navigation as any).navigate('ExperienceEdit', { experienceId });
// //     } else {
// //       setShowInviteSheet(true);
// //     }
// //   };

// //   const handleReserve = () => {
// //     if (!selectedDate) {
// //       // Show a simple date picker or allow user to select today's date
// //       const today = new Date().toISOString().split('T')[0];
// //       setSelectedDate(today);
// //       Alert.alert(
// //         'Date Selected', 
// //         `Selected today's date (${today}). Proceed to booking?`,
// //         [
// //           { text: 'Cancel', style: 'cancel' },
// //           { 
// //             text: 'Continue', 
// //             onPress: () => {
// //               (navigation as any).navigate('ExperienceBookingConfirmation', {
// //                 experienceId,
// //                 selectedDate: today,
// //                 selectedTime: '', // You can add time selection later
// //               });
// //             }
// //           }
// //         ]
// //       );
// //       return;
// //     }
// //     // Navigate to booking confirmation screen
// //     (navigation as any).navigate('ExperienceBookingConfirmation', {
// //       experienceId,
// //       selectedDate,
// //       selectedTime: '', // You can add time selection later
// //     });
// //   };

// //   console.log("THIS IS TEH ID FROM THE PROFESSIONALEXPERIENCEDETAILSSCREEN.TSX",e.id);

// //   return (
// //     <View style={styles.container}>
// //    <View
// //    style={{
// //     flex: 1,
// //     backgroundColor: '#FFF',
// //     borderBottomLeftRadius: 20,
// //     borderBottomRightRadius: 20,
// //    }}
// //    >
// //    <View style={styles.safeArea}>
// //         {/* Header */}
// //         <View style={styles.header}>
// //           <TouchableOpacity
// //             style={styles.backButton}
// //             onPress={() => navigation.goBack()}
// //           >
// //             <ArrowLeft size={24} color="#222222" weight="bold" />
// //           </TouchableOpacity>
          
// //           <View style={styles.headerActions}>
// //             <TouchableOpacity
// //               style={styles.actionButton}
// //               onPress={() => setIsLiked(!isLiked)}
// //             >
// //               <Heart 
// //                 size={24} 
// //                 color={isLiked ? "#FF385C" : "#222222"} 
// //                 weight={isLiked ? "fill" : "duotone"} 
// //               />
// //             </TouchableOpacity>
            
// //             <TouchableOpacity style={styles.actionButton}>
// //               <Share size={24} color="#222222" weight="duotone" />
// //             </TouchableOpacity>
// //           </View>
// //         </View>

// //         <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
// //           {/* Media Gallery */}
// //           <View style={styles.mediaContainer}>
// //             <FlatList
// //               ref={flatListRef}
// //               data={getMediaItems()}
// //               horizontal
// //               pagingEnabled
// //               showsHorizontalScrollIndicator={false}
// //               onScroll={handleMediaScroll}
// //               scrollEventThrottle={16}
// //               keyExtractor={(item) => item.id}
// //               renderItem={({ item, index }) => (
// //                 <View style={styles.mediaItem}>
// //                   {item.type === 'image' ? (
// //                     <Image
// //                       source={{ uri: item.url }}
// //                       style={styles.mediaImage}
// //                       resizeMode="cover"
// //                     />
// //                   ) : (
// //                     <View style={styles.videoContainer}>
// //                       <Image
// //                         source={{ uri: item.url }}
// //                         style={styles.mediaImage}
// //                         resizeMode="cover"
// //                       />
// //                       <View style={styles.videoOverlay}>
// //                         <TouchableOpacity
// //                           style={styles.playButton}
// //                           onPress={handleVideoPlay}
// //                         >
// //                           {isVideoPlaying ? (
// //                             <Pause size={32} color="#FFFFFF" weight="fill" />
// //                           ) : (
// //                             <Play size={32} color="#FFFFFF" weight="fill" />
// //                           )}
// //                         </TouchableOpacity>
// //                         <Text style={styles.videoLabel}>Watch Demo</Text>
// //                       </View>
// //                     </View>
// //                   )}
// //                 </View>
// //               )}
// //             />
            
// //             {/* Media Indicators */}
// //             <View style={styles.mediaIndicators}>
// //               {getMediaItems().map((_, index) => (
// //                 <View
// //                   key={index}
// //                   style={[
// //                     styles.indicator,
// //                     index === currentImageIndex && styles.activeIndicator
// //                   ]}
// //                 />
// //               ))}
// //             </View>
            
// //             {/* Media Counter */}
// //             <View style={styles.mediaCounter}>
// //               <Text style={styles.mediaCounterText}>
// //                 {currentImageIndex + 1} / {getMediaItems().length}
// //               </Text>
// //             </View>
// //           </View>

// //           {/* Main Content */}
// //           <View style={styles.content}>
// //             {/* Title and Rating */}
// //             <View style={styles.titleSection}>
// //               <Text style={styles.title}>{e.title || e.Title || 'Experience Title'}</Text>
// //               <View style={styles.ratingRow}>
// //                 <Star size={16} color="#FF385C" weight="fill" />
// //                 <Text style={styles.rating}>{(e.rating || e.Rating || 4.8).toFixed(1)}</Text>
// //                 <Text style={styles.reviewCount}>({e.reviewCount || e.ReviewCount || 24} reviews)</Text>
// //               </View>
// //             </View>

// //             {/* Host Info */}
// //             <View style={styles.hostSection}>
// //               <Image
// //                 source={{ uri: e.host?.avatarURL || 'https://i.pravatar.cc/100' }}
// //                 style={styles.hostAvatar}
// //               />
// //               <View style={styles.hostInfo}>
// //                 <Text style={styles.hostName}>Hosted by {e.host?.firstName || 'John'} {e.host?.lastName || 'Doe'}</Text>
// //                 <Text style={styles.hostJoined}>Joined in {new Date().getFullYear()}</Text>
// //               </View>
// //             </View>

// //             {/* Key Details */}
// //             <View style={styles.detailsSection}>
// //               <View style={styles.detailItem}>
// //                 <MapPin size={20} color="#FF385C" weight="duotone" />
// //                 <View style={styles.detailContent}>
// //                   <Text style={styles.detailLabel}>Location</Text>
// //                   <Text style={styles.detailValue}>{e.location || e.Location || 'Mauritania'}</Text>
// //                 </View>
// //               </View>

// //               <View style={styles.detailItem}>
// //                 <Clock size={20} color="#FF385C" weight="duotone" />
// //                 <View style={styles.detailContent}>
// //                   <Text style={styles.detailLabel}>Duration</Text>
// //                   <Text style={styles.detailValue}>{formatDuration(e.duration || e.Duration || 120)}</Text>
// //                 </View>
// //               </View>

// //               <View style={styles.detailItem}>
// //                 <Users size={20} color="#FF385C" weight="duotone" />
// //                 <View style={styles.detailContent}>
// //                   <Text style={styles.detailLabel}>Group Size</Text>
// //                   <Text style={styles.detailValue}>Up to {e.capacity || e.Capacity || 10} people</Text>
// //                 </View>
// //               </View>

// //               <View style={styles.detailItem}>
// //                 <Calendar size={20} color="#FF385C" weight="duotone" />
// //                 <View style={styles.detailContent}>
// //                   <Text style={styles.detailLabel}>Schedule</Text>
// //                   <Text style={styles.detailValue}>
// //                     {(e.startTime || e.StartTime) || '9:00 AM'} – {(e.endTime || e.EndTime) || '5:00 PM'}
// //                   </Text>
// //                 </View>
// //               </View>
// //             </View>

// //             {/* Description */}
// //             <View style={styles.section}>
// //               <Text style={styles.sectionTitle}>What you will do</Text>
// //               <Text style={styles.description}>
// //                 {e.description || e.Description || 'Join us for an amazing experience that will create lasting memories. This unique adventure combines local culture, beautiful scenery, and unforgettable moments.'}
// //               </Text>
// //             </View>

// //             {/* Video Demo Section */}
// //             {(e.videoURL || e.VideoURL) && (
// //               <View style={styles.section}>
// //                 <Text style={styles.sectionTitle}>Experience Preview</Text>
// //                 <TouchableOpacity style={styles.videoDemoCard} onPress={handleVideoPlay}>
// //                   <View style={styles.videoDemoContent}>
// //                     <View style={styles.videoDemoIcon}>
// //                       <Play size={24} color="#FF385C" weight="fill" />
// //                     </View>
// //                     <View style={styles.videoDemoText}>
// //                       <Text style={styles.videoDemoTitle}>Watch Experience Demo</Text>
// //                       <Text style={styles.videoDemoSubtitle}>See what to expect before booking</Text>
// //                     </View>
// //                     <View style={styles.videoDemoArrow}>
// //                       <Text style={styles.videoDemoArrowText}>▶</Text>
// //                     </View>
// //                   </View>
// //                 </TouchableOpacity>
// //               </View>
// //             )}

// //             {/* What's Included */}
// //             {/* <View style={styles.section}>
// //               <Text style={styles.sectionTitle}>What's included</Text>
// //               <View style={styles.includedList}>
// //                 <View style={styles.includedItem}>
// //                   <Check size={16} color="#00A699" weight="bold" />
// //                   <Text style={styles.includedText}>All necessary equipment</Text>
// //                 </View>
// //                 <View style={styles.includedItem}>
// //                   <Check size={16} color="#00A699" weight="bold" />
// //                   <Text style={styles.includedText}>Professional guide</Text>
// //                 </View>
// //                 <View style={styles.includedItem}>
// //                   <Check size={16} color="#00A699" weight="bold" />
// //                   <Text style={styles.includedText}>Refreshments</Text>
// //                 </View>
// //                 <View style={styles.includedItem}>
// //                   <Check size={16} color="#00A699" weight="bold" />
// //                   <Text style={styles.includedText}>Transportation</Text>
// //                 </View>
// //               </View>
// //             </View> */}

// //             {/* Amenities */}
// //             {getAmenities().length > 0 && (
// //               <View style={styles.section}>
// //                 <Text style={styles.sectionTitle}>Amenities</Text>
// //                 <View style={styles.amenitiesGrid}>
// //                   {getAmenities().map((amenity, index) => (
// //                     <View key={index} style={styles.amenityItem}>
// //                       <amenity.icon size={20} color="#FF385C" weight="duotone" />
// //                       <Text style={styles.amenityText}>{amenity.name}</Text>
// //                     </View>
// //                   ))}
// //                 </View>
// //               </View>
// //             )}

// //             {/* Availability Calendar */}
// //             <View style={styles.section}>
// //               <Text style={styles.sectionTitle}>Select your date</Text>
// //               <ProfessionalAvailabilityCalendar 
// //                 experienceId={experienceId} 
// //                 isHost={false}
// //                 onDateSelect={handleDateSelect}
// //                 selectedDate={selectedDate}
// //               />
// //             </View>

// //             {/* Cancellation Policy */}
// //             <View style={styles.section}>
// //               <Text style={styles.sectionTitle}>Cancellation policy</Text>
// //               <View style={styles.policyContainer}>
// //                 <Shield size={20} color="#00A699" weight="duotone" />
// //                 <Text style={styles.policyText}>
// //                   {getCancellationPolicyText(e.cancellationPolicy || e.CancellationPolicy || 'moderate')}
// //                 </Text>
// //               </View>
// //             </View>

// //             <View style={styles.bottomSpacing} />
// //           </View>
// //         </ScrollView>

// //         {/* Fixed Booking Bar */}
// //         <View style={styles.bookingBar}>
// //           <View style={styles.priceInfo}>
// //             <Text style={styles.finalPrice}>{formatPrice(e.pricePerPerson || e.PricePerPerson || 0)}</Text>
// //             <Text style={styles.priceLabel}>per person</Text>
// //           </View>
          
// //           <TouchableOpacity
// //             style={[styles.inviteButton, capacityLeft === 0 && styles.inviteButtonDisabled]}
// //             onPress={handleInvite}
// //             disabled={capacityLeft === 0}
// //           >
// //             <Text style={[styles.inviteText, capacityLeft === 0 && styles.inviteTextDisabled]}>
// //               {isHost ? 'Edit' : (capacityLeft > 0 ? 'Invite' : 'Full')}
// //             </Text>
// //           </TouchableOpacity>
          
// //           <TouchableOpacity 
// //             style={styles.reserveButton}
// //             onPress={handleReserve}
// //           >
// //             <Text style={styles.reserveText}>
// //               Reserve
// //             </Text>
// //           </TouchableOpacity>
// //         </View>
// //       </View>
// //    </View>


// //       {/* Simple Video Player */}
// //       <SimpleVideoPlayer
// //         videoUrl={e.videoURL || e.VideoURL || ''}
// //         isVisible={showVideoPlayer}
// //         onClose={handleCloseVideo}
// //       />

// //       {/* Invite Bottom Sheet */}
// //       <Modal visible={showInviteSheet} transparent animationType="slide" onRequestClose={() => setShowInviteSheet(false)}>
// //         <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setShowInviteSheet(false)} />
// //         <View style={styles.sheetContainer}>
// //           <View style={styles.sheetHandle} />
// //           <Text style={styles.sheetTitle}>Inviter des amis</Text>
// //           <Text style={styles.sheetSubtitle}>Créer un groupe pour cette expérience ?</Text>

// //           <TouchableOpacity
// //             style={styles.sheetPrimary}
// //             onPress={() => {
// //               setShowInviteSheet(false);
// //               (navigation as any).navigate('GroupOnboarding', { experienceId });
// //             }}
// //           >
// //             <Text style={styles.sheetPrimaryText}>Créer un groupe</Text>
// //           </TouchableOpacity>

// //           <TouchableOpacity
// //             style={styles.sheetSecondary}
// //             onPress={() => {
// //               setShowInviteSheet(false);
// //               (navigation as any).navigate('MyGroups');
// //             }}
// //           >
// //             <Text style={styles.sheetSecondaryText}>Voir mes groupes</Text>
// //           </TouchableOpacity>

// //           <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowInviteSheet(false)}>
// //             <Text style={styles.sheetCancelText}>Annuler</Text>
// //           </TouchableOpacity>
// //         </View>
// //       </Modal>
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     // add color please the F5F5F5 is gra i want a random cool color  
// //     // add random cool color add between ' a random one do not write a function no math.flor !!
// //     backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16),
// //   },
// //   safeArea: {
// //     flex: 1,
// //   },
// //   loadingContainer: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   loadingText: {
// //     fontSize: 16,
// //     color: '#717171',
// //   },
// //   errorContainer: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   errorText: {
// //     fontSize: 16,
// //     color: '#FF5A5F',
// //   },
// //   header: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     paddingHorizontal: 20,
// //     paddingVertical: 12,
// //     position: "absolute",
// //     // top: 0,
// //     left: 0,
// //     right: 0,
// //     zIndex: 100,
// //     marginTop: "10%",
// //   },
// //   backButton: {
// //     padding: 8,
// //       backgroundColor: "#FFFFFF",
// //       borderRadius: 100,
// //       shadowColor: "#000",
// //       shadowOffset: { width: 0, height: 1 },
// //       shadowOpacity: 0.2,
// //       shadowRadius: 2,
// //       elevation: 2,
// //   },
// //   headerActions: {
// //     flexDirection: 'row',
// //     gap: 12,
// //     backgroundColor: "#FFFFFF",
// //     borderRadius: 100,
// //     paddingHorizontal: 5,
// //     shadowColor: "#000",
// //     shadowOffset: { width: 0, height: 1 },
// //     shadowOpacity: 0.2,
// //     shadowRadius: 2,
// //     elevation: 2,
// //   },
// //   actionButton: {
// //     padding: 8,
// //   },
// //   scrollView: {
// //     flex: 1,
// //   },
// //   mediaContainer: {
// //     position: 'relative',
// //   },
// //   mediaItem: {
// //     width: width,
// //     height: 300,
// //   },
// //   mediaImage: {
// //     width: '100%',
// //     height: '100%',
// //   },
// //   videoContainer: {
// //     position: 'relative',
// //     width: '100%',
// //     height: '100%',
// //   },
// //   videoOverlay: {
// //     position: 'absolute',
// //     top: 0,
// //     left: 0,
// //     right: 0,
// //     bottom: 0,
// //     backgroundColor: 'rgba(0, 0, 0, 0.3)',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   playButton: {
// //     width: 60,
// //     height: 60,
// //     borderRadius: 30,
// //     backgroundColor: 'rgba(255, 255, 255, 0.9)',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     marginBottom: 8,
// //     shadowColor: '#000',
// //     shadowOffset: {
// //       width: 0,
// //       height: 2,
// //     },
// //     shadowOpacity: 0.25,
// //     shadowRadius: 3.84,
// //     elevation: 5,
// //   },
// //   videoLabel: {
// //     color: '#FFFFFF',
// //     fontSize: 14,
// //     fontWeight: '600',
// //     textShadowColor: 'rgba(0, 0, 0, 0.5)',
// //     textShadowOffset: { width: 0, height: 1 },
// //     textShadowRadius: 2,
// //   },
// //   mediaIndicators: {
// //     position: 'absolute',
// //     bottom: 16,
// //     left: 20,
// //     flexDirection: 'row',
// //     gap: 8,
// //   },
// //   mediaCounter: {
// //     position: 'absolute',
// //     top: 16,
// //     right: 20,
// //     backgroundColor: 'rgba(0, 0, 0, 0.6)',
// //     paddingHorizontal: 12,
// //     paddingVertical: 6,
// //     borderRadius: 16,
// //   },
// //   mediaCounterText: {
// //     color: '#FFFFFF',
// //     fontSize: 12,
// //     fontWeight: '600',
// //   },
// //   indicator: {
// //     width: 8,
// //     height: 8,
// //     borderRadius: 4,
// //     backgroundColor: 'rgba(255, 255, 255, 0.5)',
// //   },
// //   activeIndicator: {
// //     backgroundColor: '#FFFFFF',
// //   },
// //   content: {
// //     padding: 20,
// //   },
// //   titleSection: {
// //     marginBottom: 20,
// //   },
// //   title: {
// //     fontSize: 28,
// //     fontWeight: '700',
// //     color: '#222222',
// //     marginBottom: 8,
// //     lineHeight: 34,
// //   },
// //   ratingRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 6,
// //   },
// //   rating: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#222222',
// //   },
// //   reviewCount: {
// //     fontSize: 14,
// //     color: '#717171',
// //   },
// //   hostSection: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     marginBottom: 24,
// //     paddingBottom: 20,
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#F0F0F0',
// //   },
// //   hostAvatar: {
// //     width: 48,
// //     height: 48,
// //     borderRadius: 24,
// //     marginRight: 12,
// //   },
// //   hostInfo: {
// //     flex: 1,
// //   },
// //   hostName: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#222222',
// //     marginBottom: 2,
// //   },
// //   hostJoined: {
// //     fontSize: 14,
// //     color: '#717171',
// //   },
// //   detailsSection: {
// //     marginBottom: 24,
// //   },
// //   detailItem: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     marginBottom: 16,
// //   },
// //   detailContent: {
// //     marginLeft: 12,
// //     flex: 1,
// //   },
// //   detailLabel: {
// //     fontSize: 14,
// //     color: '#717171',
// //     marginBottom: 2,
// //   },
// //   detailValue: {
// //     fontSize: 16,
// //     fontWeight: '500',
// //     color: '#222222',
// //   },
// //   section: {
// //     marginBottom: 32,
// //   },
// //   sectionTitle: {
// //     fontSize: 22,
// //     fontWeight: '700',
// //     color: '#222222',
// //     marginBottom: 16,
// //   },
// //   description: {
// //     fontSize: 16,
// //     lineHeight: 24,
// //     color: '#222222',
// //   },
// //   videoDemoCard: {
// //     backgroundColor: '#F7F7F7',
// //     borderRadius: 12,
// //     borderWidth: 1,
// //     borderColor: '#EBEBEB',
// //     overflow: 'hidden',
// //   },
// //   videoDemoContent: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     padding: 16,
// //   },
// //   videoDemoIcon: {
// //     width: 48,
// //     height: 48,
// //     borderRadius: 24,
// //     backgroundColor: '#FFFFFF',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     marginRight: 12,
// //     shadowColor: '#000',
// //     shadowOffset: {
// //       width: 0,
// //       height: 1,
// //     },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 2,
// //     elevation: 2,
// //   },
// //   videoDemoText: {
// //     flex: 1,
// //   },
// //   videoDemoTitle: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#222222',
// //     marginBottom: 2,
// //   },
// //   videoDemoSubtitle: {
// //     fontSize: 14,
// //     color: '#717171',
// //   },
// //   videoDemoArrow: {
// //     marginLeft: 12,
// //   },
// //   videoDemoArrowText: {
// //     fontSize: 16,
// //     color: '#FF385C',
// //     fontWeight: '600',
// //   },
// //   includedList: {
// //     gap: 12,
// //   },
// //   includedItem: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 12,
// //   },
// //   includedText: {
// //     fontSize: 16,
// //     color: '#222222',
// //   },
// //   amenitiesGrid: {
// //     flexDirection: 'row',
// //     flexWrap: 'wrap',
// //     gap: 16,
// //   },
// //   amenityItem: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 8,
// //     paddingHorizontal: 12,
// //     paddingVertical: 8,
// //     backgroundColor: '#F7F7F7',
// //     borderRadius: 20,
// //   },
// //   amenityText: {
// //     fontSize: 14,
// //     color: '#222222',
// //     fontWeight: '500',
// //   },
// //   policyContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'flex-start',
// //     gap: 12,
// //     padding: 16,
// //     backgroundColor: '#F0FDF4',
// //     borderRadius: 12,
// //     borderWidth: 1,
// //     borderColor: '#D1FAE5',
// //   },
// //   policyText: {
// //     flex: 1,
// //     fontSize: 14,
// //     color: '#065F46',
// //     lineHeight: 20,
// //   },
// //   reviewSummary: {
// //     padding: 20,
// //     backgroundColor: '#F7F7F7',
// //     borderRadius: 12,
// //   },
// //   ratingBreakdown: {
// //     alignItems: 'center',
// //   },
// //   ratingNumber: {
// //     fontSize: 32,
// //     fontWeight: '700',
// //     color: '#222222',
// //     marginBottom: 8,
// //   },
// //   ratingStars: {
// //     flexDirection: 'row',
// //     gap: 2,
// //     marginBottom: 8,
// //   },
// //   bottomSpacing: {
// //     height: 100,
// //   },
// //   bookingBar: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     paddingHorizontal: 20,
// //     paddingVertical: 16,
// //     backgroundColor: '#FFFFFF',
// //     borderTopWidth: 1,
// //     borderTopColor: '#EBEBEB',
// //     marginBottom: 20
// //   },
// //   priceInfo: {
// //     flex: 1,
// //   },
// //   finalPrice: {
// //     fontSize: 22,
// //     fontWeight: '700',
// //     color: '#222222',
// //   },
// //   priceLabel: {
// //     fontSize: 14,
// //     color: '#717171',
// //   },
// //   inviteButton: {
// //     backgroundColor: '#00A699',
// //     paddingHorizontal: 16,
// //     paddingVertical: 12,
// //     borderRadius: 8,
// //     marginRight: 10,
// //   },
// //   inviteButtonDisabled: {
// //     backgroundColor: '#CDEBE3',
// //   },
// //   inviteText: {
// //     color: '#FFFFFF',
// //     fontSize: 14,
// //     fontWeight: '700',
// //   },
// //   inviteTextDisabled: {
// //     color: '#F8F8F8',
// //   },
// //   reserveButton: {
// //     backgroundColor: '#FF385C',
// //     paddingHorizontal: 24,
// //     paddingVertical: 12,
// //     borderRadius: 8,
// //   },
// //   reserveButtonDisabled: {
// //     backgroundColor: '#FFB3BA',
// //   },
// //   reserveText: {
// //     color: '#FFFFFF',
// //     fontSize: 14,
// //     fontWeight: '700',
// //   },
// //   reserveTextDisabled: {
// //     color: '#FFFFFF',
// //     opacity: 0.7,
// //   },
// //   sheetBackdrop: {
// //     flex: 1,
// //     backgroundColor: 'rgba(0,0,0,0.35)',
// //   },
// //   sheetContainer: {
// //     backgroundColor: '#FFFFFF',
// //     paddingHorizontal: 20,
// //     paddingTop: 8,
// //     paddingBottom: 24,
// //     borderTopLeftRadius: 16,
// //     borderTopRightRadius: 16,
// //   },
// //   sheetHandle: {
// //     alignSelf: 'center',
// //     width: 40,
// //     height: 4,
// //     borderRadius: 2,
// //     backgroundColor: '#E5E5E5',
// //     marginBottom: 12,
// //   },
// //   sheetTitle: {
// //     fontSize: 18,
// //     fontWeight: '700',
// //     color: '#222222',
// //     marginBottom: 4,
// //     textAlign: 'center',
// //   },
// //   sheetSubtitle: {
// //     fontSize: 14,
// //     color: '#717171',
// //     marginBottom: 16,
// //     textAlign: 'center',
// //   },
// //   sheetPrimary: {
// //     backgroundColor: '#FF385C',
// //     paddingVertical: 14,
// //     borderRadius: 10,
// //     alignItems: 'center',
// //     marginBottom: 10,
// //   },
// //   sheetPrimaryText: {
// //     color: '#FFFFFF',
// //     fontSize: 16,
// //     fontWeight: '700',
// //   },
// //   sheetSecondary: {
// //     backgroundColor: '#F7F7F7',
// //     paddingVertical: 14,
// //     borderRadius: 10,
// //     alignItems: 'center',
// //     marginBottom: 8,
// //   },
// //   sheetSecondaryText: {
// //     color: '#222222',
// //     fontSize: 16,
// //     fontWeight: '600',
// //   },
// //   sheetCancel: {
// //     paddingVertical: 14,
// //     alignItems: 'center',
// //   },
// //   sheetCancelText: {
// //     color: '#717171',
// //     fontSize: 16,
// //     fontWeight: '600',
// //   },
// // });


// import React, { useState, useRef } from 'react';
// import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Dimensions, Alert, FlatList, Modal } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import { Video } from 'expo-av';
// import { LinearGradient } from 'expo-linear-gradient';
// import { 
//   ArrowLeft, 
//   Heart, 
//   Share, 
//   Star, 
//   MapPin, 
//   Clock, 
//   Users, 
//   Calendar,
//   Shield,
//   WifiHigh,
//   Car,
//   Coffee,
//   Camera,
//   MusicNote,
//   ForkKnife,
//   GameController,
//   Check,
//   Play,
//   Pause,
//   Globe,
//   Info,
//   Phone,
//   GiftIcon,
//   GlobeIcon,
//   ClockIcon,
//   FileAudioIcon,
//   FileAudio
// } from 'phosphor-react-native';
// import { useExperienceDetails } from '../hooks/queries/useExperienceDetails';
// import { useExperienceParticipants } from '../hooks/queries/useExperienceInvites';
// import { useUser } from '../hooks/useUser';
// import { ProfessionalAvailabilityCalendar } from '../components/ProfessionalAvailabilityCalendar';

// const { width, height } = Dimensions.get('window');

// export const ProfessionalExperienceDetailsScreen = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { experienceId } = route.params as { experienceId: number };
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [isLiked, setIsLiked] = useState(false);
//   const [selectedDate, setSelectedDate] = useState<string>('');
//   const [isVideoPlaying, setIsVideoPlaying] = useState(false);
//   const [videoMuted, setVideoMuted] = useState(false);
//   const [showInviteSheet, setShowInviteSheet] = useState(false);
//   const flatListRef = useRef<FlatList>(null);
//   const videoRef = useRef<Video>(null);
  
//   const { data: experience, isLoading } = useExperienceDetails(experienceId);
//   const { data: participants = [] } = useExperienceParticipants(experienceId);
//   const { user } = useUser();

//   // Mock data based on your log
//   const experienceData = {
//     activityLevel: "light",
//     approvedAt: null,
//     arrivalTime: 15,
//     bookings: null,
//     bringRequired: false,
//     cancellationPolicy: "flexible",
//     city: "Nouakchott",
//     createdAt: "2025-09-19T23:14:24.982134+02:00",
//     description: "Ce que nous allons faire demain\nDemain matin, nous irons prendre un café dans un petit bistrot au centre-ville. Ensuite, nous visiterons le musée d'art moderne pour découvrir une nouvelle exposition. L'après-midi, nous ferons une promenade au bord de la mer et nous prendrons des photos. Enfin, le soir, nous dînerons ensemble dans un restaurant traditionnel pour goûter des spécialités locales.",
//     difficultyLevel: "beginner",
//     duration: 60,
//     endTime: "12:00",
//     focus: "art",
//     groupDiscounts: [],
//     groupSize: 8,
//     hasHostedBefore: false,
//     host: {
//       CreatedAt: "2025-09-17T00:12:54.079432+02:00",
//       DeletedAt: null,
//       ID: 1,
//       UpdatedAt: "2025-09-24T04:24:26.795741+02:00",
//       allowsNotifications: true,
//       avatarURL: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758668195/property_images/hosts/1.png",
//       bio: "agreeing on the trip's purpose, destination, and budget. Then, appoint a leader to coordinate activities and payments, and use a shared document for communication",
//       dateOfBirth: "01/01/2001",
//       email: "w979k4tn9y@privaterelay.appleid.com",
//       firstName: "Khakil",
//       idBackImage: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758675860/property_images/verification/1/id_back.jpg",
//       idFrontImage: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758675859/property_images/verification/1/id_front.jpg",
//       idNumber: "11111111",
//       idType: "national_id",
//       isVerified: true,
//       languages: ["Français", "Anglais", "Arabe"],
//       lastName: "Dhmine",
//       password: "",
//       properties: null,
//       pushTokens: ["ExponentPushToken[TfYTvYBeA8mpJVduwEWhL5]"],
//       savedProperties: [8, 9, 10],
//       selfieImage: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758675862/property_images/verification/1/selfie.jpg",
//       socialLogin: true,
//       socialProvider: "Apple",
//       verificationStatus: "verified"
//     },
//     hostID: 1,
//     hostedFor: "",
//     id: 23,
//     identityVerified: false,
//     language: "Arabic",
//     maxAge: 13,
//     minAge: 6,
//     photos: [
//       {
//         caption: "",
//         order: 1,
//         url: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758315397/u7visuocnqe7mzvurry2.png"
//       },
//       {
//         caption: "",
//         order: 2,
//         url: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758315407/mf9pdramnntmifeisakx.jpg"
//       },
//       {
//         caption: "",
//         order: 3,
//         url: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758315416/wu8pjpm0dsb1sxsgdger.jpg"
//       },
//       {
//         caption: "",
//         order: 4,
//         url: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758315423/h357dclm6e05okyp2qbp.jpg"
//       },
//       {
//         caption: "",
//         order: 5,
//         url: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758315433/gbn0f2yx9f8ua6xcnpqa.jpg"
//       }
//     ],
//     pricePerPerson: 400,
//     reviewNotes: "Experience submitted for review. We will contact you within 5 hours.",
//     reviewStatus: "pending",
//     startTime: "09:00",
//     status: "live",
//     title: "Sunset camel nktt",
//     updatedAt: "2025-09-19T23:14:25.062251+02:00",
//     videoURL: "https://res.cloudinary.com/djwnohmqm/video/upload/v1758315490/drdqjxqysniw4gecfsjq.mov",
//     whatToBring: "",
//     whatWeDo: "Ce que nous allons faire demain\nDemain matin, nous irons prendre un café dans un petit bistrot au centre-ville. Ensuite, nous visiterons le musée d'art moderne pour découvrir une nouvelle exposition. L'après-midi, nous ferons une promenade au bord de la mer et nous prendrons des photos. Enfin, le soir, nous dînerons ensemble dans un restaurant traditionnel pour goûter des spécialités locales."
//   };

//   const e = experience || experienceData;
//   const capacityLeft = (e.groupSize || e.capacity || e.Capacity || 8) - participants.length;
//   const isHost = user?.ID === e.hostID || user?.ID === e.HostID;

//   if (isLoading && !experienceData) {
//     return (
//       <View style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <Text style={styles.loadingText}>Loading experience details...</Text>
//         </View>
//       </View>
//     );
//   }

//   const formatPrice = (price: number) => {
//     return `${price} MRU`;
//   };

//   const formatDuration = (minutes: number) => {
//     const hours = Math.floor(minutes / 60);
//     const mins = minutes % 60;
//     if (hours > 0 && mins > 0) {
//       return `${hours}h ${mins}min`;
//     } else if (hours > 0) {
//       return `${hours}h`;
//     } else {
//       return `${mins}min`;
//     }
//   };

//   const getCancellationPolicyText = (policy: string) => {
//     switch (policy?.toLowerCase()) {
//       case 'flexible':
//         return 'Annulation gratuite jusqu\'à 24h avant le début';
//       case 'moderate':
//         return 'Annulation gratuite jusqu\'à 5 jours avant le début';
//       case 'strict':
//         return 'Annulation gratuite jusqu\'à 7 jours avant le début (50% remboursement)';
//       default:
//         return 'Politique d\'annulation flexible';
//     }
//   };

//   const getMediaItems = () => {
//     const items = [];
    
//     // Add video first if available
//     if (e.videoURL) {
//       items.push({
//         type: 'video',
//         url: e.videoURL,
//         id: 'demo-video'
//       });
//     }
    
//     // Add photos
//     if (e.photos && Array.isArray(e.photos)) {
//       e.photos.forEach((photo, index) => {
//         if (photo && photo.url) {
//           items.push({
//             type: 'image',
//             url: photo.url,
//             id: `photo-${index}`
//           });
//         }
//       });
//     }
    
//     return items.length > 0 ? items : [{
//       type: 'image',
//       url: 'https://via.placeholder.com/400x300?text=No+Images+Available',
//       id: 'placeholder-image'
//     }];
//   };

//   const handleMediaScroll = (event: any) => {
//     const contentOffset = event.nativeEvent.contentOffset;
//     const viewSize = event.nativeEvent.layoutMeasurement;
//     const pageNum = Math.floor(contentOffset.x / viewSize.width);
//     setCurrentImageIndex(pageNum);
//   };

//   const toggleVideoPlayback = async () => {
//     if (videoRef.current) {
//       if (isVideoPlaying) {
//         await videoRef.current.pauseAsync();
//       } else {
//         await videoRef.current.playAsync();
//       }
//       setIsVideoPlaying(!isVideoPlaying);
//     }
//   };

//   const toggleVideoMute = async () => {
//     if (videoRef.current) {
//       await videoRef.current.setIsMutedAsync(!videoMuted);
//       setVideoMuted(!videoMuted);
//     }
//   };

//   const handleDateSelect = (date: string) => {
//     setSelectedDate(date);
//     Alert.alert('Date Selected', `Vous avez sélectionné ${date}. Procéder à la réservation?`);
//   };

//   const handleInvite = () => {
//     if (isHost) {
//       (navigation as any).navigate('ExperienceEdit', { experienceId });
//     } else {
//       setShowInviteSheet(true);
//     }
//   };

//   const handleReserve = () => {
//     if (!selectedDate) {
//       const today = new Date().toISOString().split('T')[0];
//       setSelectedDate(today);
//       Alert.alert(
//         'Réservation', 
//         `Réserver pour aujourd'hui (${today})?`,
//         [
//           { text: 'Annuler', style: 'cancel' },
//           { 
//             text: 'Continuer', 
//             onPress: () => {
//               (navigation as any).navigate('ExperienceBookingConfirmation', {
//                 experienceId,
//                 selectedDate: today,
//                 selectedTime: e.startTime,
//               });
//             }
//           }
//         ]
//       );
//       return;
//     }
    
//     (navigation as any).navigate('ExperienceBookingConfirmation', {
//       experienceId,
//       selectedDate,
//       selectedTime: e.startTime,
//     });
//   };

//   const getDifficultyColor = (level: string) => {
//     switch (level?.toLowerCase()) {
//       case 'beginner': return '#4ADE80';
//       case 'intermediate': return '#FBBF24';
//       case 'advanced': return '#F87171';
//       default: return '#94A3B8';
//     }
//   };

//   const getActivityLevelColor = (level: string) => {
//     switch (level?.toLowerCase()) {
//       case 'light': return '#10B981';
//       case 'moderate': return '#F59E0B';
//       case 'intense': return '#EF4444';
//       default: return '#6B7280';
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.safeArea}>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}
//           >
//             <ArrowLeft size={24} color="#222222" weight="bold" />
//           </TouchableOpacity>
          
//           <View style={styles.headerActions}>
//             <TouchableOpacity
//               style={styles.actionButton}
//               onPress={() => setIsLiked(!isLiked)}
//             >
//               <Heart 
//                 size={24} 
//                 color={isLiked ? "#FF385C" : "#222222"} 
//                 weight={isLiked ? "fill" : "duotone"} 
//               />
//             </TouchableOpacity>
            
//             <TouchableOpacity style={styles.actionButton}>
//               <Share size={24} color="#222222" weight="duotone" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//           {/* Media Gallery */}
//           <View style={styles.mediaContainer}>
//             <FlatList
//               ref={flatListRef}
//               data={getMediaItems()}
//               horizontal
//               pagingEnabled
//               showsHorizontalScrollIndicator={false}
//               onScroll={handleMediaScroll}
//               scrollEventThrottle={16}
//               keyExtractor={(item) => item.id}
//               renderItem={({ item, index }) => (
//                 <View style={styles.mediaItem}>
//                   {item.type === 'image' ? (
//                     <Image
//                       source={{ uri: item.url }}
//                       style={styles.mediaImage}
//                       resizeMode="cover"
//                     />
//                   ) : (
//                     <View style={styles.videoContainer}>
//                       <Video
//                         ref={videoRef}
//                         source={{ uri: item.url }}
//                         style={styles.mediaImage}
//                         useNativeControls={false}
//                         resizeMode="cover"
//                         shouldPlay={false}
//                         isLooping={true}
//                         onPlaybackStatusUpdate={(status) => {
//                           if (status.isLoaded) {
//                             setIsVideoPlaying(status.isPlaying || false);
//                           }
//                         }}
//                       />
//                       <LinearGradient
//                         colors={['transparent', 'rgba(0,0,0,0.6)']}
//                         style={styles.videoOverlay}
//                       >
//                         <View style={styles.videoControls}>
//                           <TouchableOpacity
//                             style={styles.playButton}
//                             onPress={toggleVideoPlayback}
//                           >
//                             {isVideoPlaying ? (
//                               <Pause size={24} color="#FFFFFF" weight="fill" />
//                             ) : (
//                               <Play size={24} color="#FFFFFF" weight="fill" />
//                             )}
//                           </TouchableOpacity>
                          
//                           <TouchableOpacity
//                             style={styles.muteButton}
//                             onPress={toggleVideoMute}
//                           >
//                             {videoMuted ? (
//                               <FileAudioIcon size={20} color="#FFFFFF" weight="duotone" />
//                             ) : (
//                               <FileAudioIcon size={20} color="#FFFFFF" weight="duotone" />
//                             )}
//                           </TouchableOpacity>
//                         </View>
                        
//                         <View style={styles.videoLabel}>
//                           <Text style={styles.videoLabelText}>Aperçu de l'expérience</Text>
//                         </View>
//                       </LinearGradient>
//                     </View>
//                   )}
//                 </View>
//               )}
//             />
            
//             {/* Media Indicators */}
//             <View style={styles.mediaIndicators}>
//               {getMediaItems().map((_, index) => (
//                 <View
//                   key={index}
//                   style={[
//                     styles.indicator,
//                     index === currentImageIndex && styles.activeIndicator
//                   ]}
//                 />
//               ))}
//             </View>
            
//             {/* Media Counter */}
//             <View style={styles.mediaCounter}>
//               <Text style={styles.mediaCounterText}>
//                 {currentImageIndex + 1} / {getMediaItems().length}
//               </Text>
//             </View>

//             {/* Status Badge */}
//             <View style={styles.statusBadge}>
//               <Text style={styles.statusText}>{e.status === 'live' ? 'Disponible' : 'Non disponible'}</Text>
//             </View>
//           </View>

//           {/* Main Content */}
//           <View style={styles.content}>
//             {/* Title and Rating */}
//             <View style={styles.titleSection}>
//               <Text style={styles.title}>{e.title || 'Experience Title'}</Text>
//               <View style={styles.ratingRow}>
//                 <Star size={16} color="#FF385C" weight="fill" />
//                 <Text style={styles.rating}>4.8</Text>
//                 <Text style={styles.reviewCount}>(24 avis) • </Text>
//                 <MapPin size={14} color="#717171" weight="duotone" />
//                 <Text style={styles.location}>{e.city}</Text>
//               </View>
//             </View>

//             {/* Host Info */}
//             <View style={styles.hostSection}>
//               <Image
//                 source={{ uri: e.host?.avatarURL }}
//                 style={styles.hostAvatar}
//               />
//               <View style={styles.hostInfo}>
//                 <View style={styles.hostNameRow}>
//                   <Text style={styles.hostName}>Animé par {e.host?.firstName} {e.host?.lastName}</Text>
//                   {e.host?.isVerified && (
//                     <View style={styles.verifiedBadge}>
//                       <Shield size={14} color="#00A699" weight="fill" />
//                     </View>
//                   )}
//                 </View>
//                 <Text style={styles.hostJoined}>Membre depuis 2024</Text>
//                 <View style={styles.hostLanguages}>
//                   {e.host?.languages?.map((lang, index) => (
//                     <View key={index} style={styles.languageChip}>
//                       <Text style={styles.languageText}>{lang}</Text>
//                     </View>
//                   ))}
//                 </View>
//               </View>
//             </View>

//             {/* Experience Tags */}
//             <View style={styles.tagsSection}>
//               <View style={styles.tagRow}>
//                 <View style={[styles.tag, { backgroundColor: getDifficultyColor(e.difficultyLevel) + '20' }]}>
//                   <GiftIcon size={14} color={getDifficultyColor(e.difficultyLevel)} weight="duotone" />
//                   <Text style={[styles.tagText, { color: getDifficultyColor(e.difficultyLevel) }]}>
//                     {e.difficultyLevel === 'beginner' ? 'Débutant' : e.difficultyLevel}
//                   </Text>
//                 </View>
                
//                 <View style={[styles.tag, { backgroundColor: getActivityLevelColor(e.activityLevel) + '20' }]}>
//                   <Text style={[styles.tagText, { color: getActivityLevelColor(e.activityLevel) }]}>
//                     Intensité {e.activityLevel === 'light' ? 'légère' : e.activityLevel}
//                   </Text>
//                 </View>

//                 <View style={styles.tag}>
//                   <GlobeIcon size={14} color="#6366F1" weight="duotone" />
//                   <Text style={[styles.tagText, { color: '#6366F1' }]}>{e.language}</Text>
//                 </View>
//               </View>
//             </View>

//             {/* Key Details */}
//             <View style={styles.detailsSection}>
//               <View style={styles.detailItem}>
//                 <ClockIcon size={20} color="#FF385C" weight="duotone" />
//                 <View style={styles.detailContent}>
//                   <Text style={styles.detailLabel}>Durée</Text>
//                   <Text style={styles.detailValue}>{formatDuration(e.duration)}</Text>
//                 </View>
//               </View>

//               <View style={styles.detailItem}>
//                 <Users size={20} color="#FF385C" weight="duotone" />
//                 <View style={styles.detailContent}>
//                   <Text style={styles.detailLabel}>Taille du groupe</Text>
//                   <Text style={styles.detailValue}>Jusqu'à {e.groupSize} personnes</Text>
//                 </View>
//               </View>

//               <View style={styles.detailItem}>
//                 <Calendar size={20} color="#FF385C" weight="duotone" />
//                 <View style={styles.detailContent}>
//                   <Text style={styles.detailLabel}>Horaires</Text>
//                   <Text style={styles.detailValue}>{e.startTime} – {e.endTime}</Text>
//                 </View>
//               </View>

//               <View style={styles.detailItem}>
//                 <Users size={20} color="#FF385C" weight="duotone" />
//                 <View style={styles.detailContent}>
//                   <Text style={styles.detailLabel}>Âge</Text>
//                   <Text style={styles.detailValue}>{e.minAge}+ ans ({e.maxAge} max)</Text>
//                 </View>
//               </View>
//             </View>

//             {/* Description */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>À propos de cette expérience</Text>
//               <Text style={styles.description}>{e.description}</Text>
//             </View>

//             {/* What We'll Do */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Ce que nous ferons</Text>
//               <Text style={styles.description}>{e.whatWeDo}</Text>
//             </View>

//             {/* Included Items */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Ce qui est inclus</Text>
//               <View style={styles.includedList}>
//                 <View style={styles.includedItem}>
//                   <Check size={16} color="#00A699" weight="bold" />
//                   <Text style={styles.includedText}>Guide professionnel</Text>
//                 </View>
//                 <View style={styles.includedItem}>
//                   <Check size={16} color="#00A699" weight="bold" />
//                   <Text style={styles.includedText}>Équipement nécessaire</Text>
//                 </View>
//                 <View style={styles.includedItem}>
//                   <Check size={16} color="#00A699" weight="bold" />
//                   <Text style={styles.includedText}>Rafraîchissements</Text>
//                 </View>
//                 <View style={styles.includedItem}>
//                   <Check size={16} color="#00A699" weight="bold" />
//                   <Text style={styles.includedText}>Photos souvenir</Text>
//                 </View>
//               </View>
//             </View>

//             {/* Availability Calendar */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Choisissez votre date</Text>
//               <ProfessionalAvailabilityCalendar 
//                 experienceId={experienceId} 
//                 isHost={false}
//                 onDateSelect={handleDateSelect}
//                 selectedDate={selectedDate}
//               />
//             </View>

//             {/* Cancellation Policy */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Politique d'annulation</Text>
//               <View style={styles.policyContainer}>
//                 <Shield size={20} color="#00A699" weight="duotone" />
//                 <View style={styles.policyContent}>
//                   <Text style={styles.policyTitle}>Annulation {e.cancellationPolicy}</Text>
//                   <Text style={styles.policyText}>{getCancellationPolicyText(e.cancellationPolicy)}</Text>
//                 </View>
//               </View>
//             </View>

//             {/* Bottom Information Section */}
//             <View style={styles.bottomInfoSection}>
//               <View style={styles.bottomInfoCard}>
//                 <View style={styles.bottomInfoHeader}>
//                   <Info size={24} color="#FF385C" weight="duotone" />
//                   <Text style={styles.bottomInfoTitle}>Informations importantes</Text>
//                 </View>
                
//                 <View style={styles.bottomInfoContent}>
//                   <View style={styles.infoRow}>
//                     <Text style={styles.infoLabel}>Statut de l'expérience:</Text>
//                     <Text style={[styles.infoValue, { color: e.reviewStatus === 'pending' ? '#F59E0B' : '#10B981' }]}>
//                       {e.reviewStatus === 'pending' ? 'En attente d\'approbation' : 'Approuvée'}
//                     </Text>
//                   </View>
                  
//                   <View style={styles.infoRow}>
//                     <Text style={styles.infoLabel}>Temps d'arrivée:</Text>
//                     <Text style={styles.infoValue}>{e.arrivalTime} minutes avant</Text>
//                   </View>
                  
//                   <View style={styles.infoRow}>
//                     <Text style={styles.infoLabel}>Focus:</Text>
//                     <Text style={styles.infoValue}>{e.focus}</Text>
//                   </View>
                  
//                   {e.whatToBring && (
//                     <View style={styles.infoRow}>
//                       <Text style={styles.infoLabel}>À apporter:</Text>
//                       <Text style={styles.infoValue}>{e.whatToBring}</Text>
//                     </View>
//                   )}
//                 </View>
//               </View>

//               {/* Contact Host */}
//               <TouchableOpacity style={styles.contactHostButton}>
//                 <Phone size={20} color="#FF385C" weight="duotone" />
//                 <Text style={styles.contactHostText}>Contacter l'hôte</Text>
//               </TouchableOpacity>

//               <View style={styles.finalBottomSpacing} />
//             </View>
//           </View>
//         </ScrollView>

//         {/* Fixed Booking Bar */}
//         <View style={styles.bookingBar}>
//           <LinearGradient
//             colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
//             style={styles.bookingBarGradient}
//           >
//             <View style={styles.bookingBarContent}>
//               <View style={styles.priceInfo}>
//                 <Text style={styles.finalPrice}>{formatPrice(e.pricePerPerson)}</Text>
//                 <Text style={styles.priceLabel}>par personne</Text>
//                 <Text style={styles.availabilityText}>{capacityLeft} places restantes</Text>
//               </View>
              
//               <View style={styles.bookingActions}>
//                 <TouchableOpacity
//                   style={[styles.inviteButton, capacityLeft === 0 && styles.inviteButtonDisabled]}
//                   onPress={handleInvite}
//                   disabled={capacityLeft === 0}
//                 >
//                   <Text style={[styles.inviteText, capacityLeft === 0 && styles.inviteTextDisabled]}>
//                     {isHost ? 'Modifier' : (capacityLeft > 0 ? 'Inviter' : 'Complet')}
//                   </Text>
//                 </TouchableOpacity>
                
//                 <TouchableOpacity 
//                   style={[styles.reserveButton, capacityLeft === 0 && styles.reserveButtonDisabled]}
//                   onPress={handleReserve}
//                   disabled={capacityLeft === 0}
//                 >
//                   <Text style={[styles.reserveText, capacityLeft === 0 && styles.reserveTextDisabled]}>
//                     Réserver
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </LinearGradient>
//         </View>
//       </View>

//       {/* Invite Bottom Sheet */}
//       <Modal visible={showInviteSheet} transparent animationType="slide" onRequestClose={() => setShowInviteSheet(false)}>
//         <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setShowInviteSheet(false)} />
//         <View style={styles.sheetContainer}>
//           <View style={styles.sheetHandle} />
//           <Text style={styles.sheetTitle}>Inviter des amis</Text>
//           <Text style={styles.sheetSubtitle}>Créer un groupe pour cette expérience ?</Text>

//           <TouchableOpacity
//             style={styles.sheetPrimary}
//             onPress={() => {
//               setShowInviteSheet(false);
//               (navigation as any).navigate('GroupOnboarding', { experienceId });
//             }}
//           >
//             <Text style={styles.sheetPrimaryText}>Créer un groupe</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.sheetSecondary}
//             onPress={() => {
//               setShowInviteSheet(false);
//               (navigation as any).navigate('MyGroups');
//             }}
//           >
//             <Text style={styles.sheetSecondaryText}>Voir mes groupes</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowInviteSheet(false)}>
//             <Text style={styles.sheetCancelText}>Annuler</Text>
//           </TouchableOpacity>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#4F46E5',
//   },
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#717171',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     position: "absolute",
//     left: 0,
//     right: 0,
//     zIndex: 100,
//     marginTop: "10%",
//   },
//   backButton: {
//     padding: 12,
//     backgroundColor: "rgba(255,255,255,0.95)",
//     borderRadius: 100,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   headerActions: {
//     flexDirection: 'row',
//     gap: 12,
//     backgroundColor: "rgba(255,255,255,0.95)",
//     borderRadius: 100,
//     paddingHorizontal: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   actionButton: {
//     padding: 12,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   mediaContainer: {
//     position: 'relative',
//     height: 320,
//   },
//   mediaItem: {
//     width: width,
//     height: 320,
//   },
//   mediaImage: {
//     width: '100%',
//     height: '100%',
//   },
//   videoContainer: {
//     position: 'relative',
//     width: '100%',
//     height: '100%',
//   },
//   videoOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 120,
//     justifyContent: 'flex-end',
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },
//   videoControls: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     marginBottom: 8,
//   },
//   playButton: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   muteButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   videoLabel: {
//     alignSelf: 'flex-start',
//   },
//   videoLabelText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
//   mediaIndicators: {
//     position: 'absolute',
//     bottom: 16,
//     left: 20,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   mediaCounter: {
//     position: 'absolute',
//     top: 16,
//     right: 20,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//   },
//   mediaCounterText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   statusBadge: {
//     position: 'absolute',
//     top: 16,
//     left: 20,
//     backgroundColor: '#10B981',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//   },
//   statusText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   indicator: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: 'rgba(255, 255, 255, 0.5)',
//   },
//   activeIndicator: {
//     backgroundColor: '#FFFFFF',
//     width: 24,
//   },
//   content: {
//     padding: 20,
//   },
//   titleSection: {
//     marginBottom: 24,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: '800',
//     color: '#111827',
//     marginBottom: 12,
//     lineHeight: 38,
//   },
//   ratingRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   rating: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   reviewCount: {
//     fontSize: 14,
//     color: '#6B7280',
//   },
//   location: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginLeft: 2,
//   },
//   hostSection: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 24,
//     paddingBottom: 24,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   hostAvatar: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     marginRight: 16,
//     borderWidth: 3,
//     borderColor: '#E5E7EB',
//   },
//   hostInfo: {
//     flex: 1,
//   },
//   hostNameRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     marginBottom: 4,
//   },
//   hostName: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   verifiedBadge: {
//     padding: 4,
//     backgroundColor: '#D1FAE5',
//     borderRadius: 12,
//   },
//   hostJoined: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 8,
//   },
//   hostLanguages: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 6,
//   },
//   languageChip: {
//     backgroundColor: '#F3F4F6',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   languageText: {
//     fontSize: 12,
//     color: '#374151',
//     fontWeight: '500',
//   },
//   tagsSection: {
//     marginBottom: 24,
//   },
//   tagRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   tag: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 20,
//   },
//   tagText: {
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   detailsSection: {
//     marginBottom: 32,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//     paddingVertical: 4,
//   },
//   detailContent: {
//     marginLeft: 16,
//     flex: 1,
//   },
//   detailLabel: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 4,
//     fontWeight: '500',
//   },
//   detailValue: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   section: {
//     marginBottom: 32,
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#111827',
//     marginBottom: 16,
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 26,
//     color: '#374151',
//   },
//   includedList: {
//     gap: 12,
//   },
//   includedItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   includedText: {
//     fontSize: 16,
//     color: '#374151',
//   },
//   policyContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: 12,
//     padding: 20,
//     backgroundColor: '#ECFDF5',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#A7F3D0',
//   },
//   policyContent: {
//     flex: 1,
//   },
//   policyTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#059669',
//     marginBottom: 4,
//   },
//   policyText: {
//     fontSize: 14,
//     color: '#047857',
//     lineHeight: 20,
//   },
//   bottomInfoSection: {
//     marginTop: 24,
//   },
//   bottomInfoCard: {
//     backgroundColor: '#F8FAFC',
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//   },
//   bottomInfoHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     marginBottom: 16,
//   },
//   bottomInfoTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#111827',
//   },
//   bottomInfoContent: {
//     gap: 12,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     paddingVertical: 4,
//   },
//   infoLabel: {
//     fontSize: 14,
//     color: '#6B7280',
//     fontWeight: '500',
//     flex: 1,
//   },
//   infoValue: {
//     fontSize: 14,
//     color: '#111827',
//     fontWeight: '600',
//     flex: 1,
//     textAlign: 'right',
//   },
//   contactHostButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     backgroundColor: '#FFFFFF',
//     paddingVertical: 14,
//     borderRadius: 12,
//     borderWidth: 2,
//     borderColor: '#FF385C',
//     marginBottom: 16,
//   },
//   contactHostText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FF385C',
//   },
//   finalBottomSpacing: {
//     height: 120,
//   },
//   bookingBar: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     zIndex: 50,
//   },
//   bookingBarGradient: {
//     paddingTop: 16,
//     paddingBottom: 32,
//     paddingHorizontal: 20,
//   },
//   bookingBarContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   priceInfo: {
//     flex: 1,
//   },
//   finalPrice: {
//     fontSize: 24,
//     fontWeight: '800',
//     color: '#111827',
//   },
//   priceLabel: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 2,
//   },
//   availabilityText: {
//     fontSize: 12,
//     color: '#059669',
//     fontWeight: '500',
//   },
//   bookingActions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   inviteButton: {
//     backgroundColor: '#10B981',
//     paddingHorizontal: 20,
//     paddingVertical: 14,
//     borderRadius: 12,
//     minWidth: 80,
//     alignItems: 'center',
//   },
//   inviteButtonDisabled: {
//     backgroundColor: '#D1D5DB',
//   },
//   inviteText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '700',
//   },
//   inviteTextDisabled: {
//     color: '#9CA3AF',
//   },
//   reserveButton: {
//     backgroundColor: '#FF385C',
//     paddingHorizontal: 24,
//     paddingVertical: 14,
//     borderRadius: 12,
//     minWidth: 100,
//     alignItems: 'center',
//     shadowColor: '#FF385C',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   reserveButtonDisabled: {
//     backgroundColor: '#D1D5DB',
//     shadowOpacity: 0,
//   },
//   reserveText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   reserveTextDisabled: {
//     color: '#9CA3AF',
//   },
//   sheetBackdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   sheetContainer: {
//     backgroundColor: '#FFFFFF',
//     paddingHorizontal: 20,
//     paddingTop: 12,
//     paddingBottom: 32,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   sheetHandle: {
//     alignSelf: 'center',
//     width: 40,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: '#D1D5DB',
//     marginBottom: 16,
//   },
//   sheetTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#111827',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   sheetSubtitle: {
//     fontSize: 15,
//     color: '#6B7280',
//     marginBottom: 24,
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   sheetPrimary: {
//     backgroundColor: '#FF385C',
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginBottom: 12,
//     shadowColor: '#FF385C',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sheetPrimaryText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   sheetSecondary: {
//     backgroundColor: '#F9FAFB',
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   sheetSecondaryText: {
//     color: '#374151',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   sheetCancel: {
//     paddingVertical: 16,
//     alignItems: 'center',
//   },
//   sheetCancelText: {
//     color: '#6B7280',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });


import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Dimensions, Alert, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Heart, 
  Share, 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Calendar,
  Shield,
  Check,
  Play,
  Pause,
  Info,
  Phone,
  GlobeIcon,
  ClockIcon,
  FileAudioIcon
} from 'phosphor-react-native';
import { useExperienceDetails } from '../hooks/queries/useExperienceDetails';
import { useExperienceParticipants } from '../hooks/queries/useExperienceInvites';
import { useUser } from '../hooks/useUser';
import { ProfessionalAvailabilityCalendar } from '../components/ProfessionalAvailabilityCalendar';

const { width, height } = Dimensions.get('window');

// Airbnb-inspired color system
const COLORS = {
  primary: '#FF385C',
  primaryLight: '#FFE8ED',
  text: {
    primary: '#222222',
    secondary: '#717171',
    tertiary: '#B0B0B0',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F7F7F7',
    tertiary: '#EBEBEB',
  },
  border: '#DDDDDD',
  success: '#00A699',
  successLight: '#E8FFF9',
};

export const ProfessionalExperienceDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { experienceId } = route.params as { experienceId: number };
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const videoRef = useRef<Video>(null);
  
  const { data: experience, isLoading } = useExperienceDetails(experienceId);
  const { data: participants = [] } = useExperienceParticipants(experienceId);
  const { user } = useUser();

  // Mock data
  const experienceData = {
    activityLevel: "light",
    approvedAt: null,
    arrivalTime: 15,
    bookings: null,
    bringRequired: false,
    cancellationPolicy: "flexible",
    city: "Nouakchott",
    createdAt: "2025-09-19T23:14:24.982134+02:00",
    description: "Ce que nous allons faire demain\nDemain matin, nous irons prendre un café dans un petit bistrot au centre-ville. Ensuite, nous visiterons le musée d'art moderne pour découvrir une nouvelle exposition. L'après-midi, nous ferons une promenade au bord de la mer et nous prendrons des photos. Enfin, le soir, nous dînerons ensemble dans un restaurant traditionnel pour goûter des spécialités locales.",
    difficultyLevel: "beginner",
    duration: 60,
    endTime: "12:00",
    focus: "art",
    groupDiscounts: [],
    groupSize: 8,
    hasHostedBefore: false,
    host: {
      CreatedAt: "2025-09-17T00:12:54.079432+02:00",
      DeletedAt: null,
      ID: 1,
      UpdatedAt: "2025-09-24T04:24:26.795741+02:00",
      allowsNotifications: true,
      avatarURL: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758668195/property_images/hosts/1.png",
      bio: "agreeing on the trip's purpose, destination, and budget. Then, appoint a leader to coordinate activities and payments, and use a shared document for communication",
      dateOfBirth: "01/01/2001",
      email: "w979k4tn9y@privaterelay.appleid.com",
      firstName: "Khakil",
      idBackImage: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758675860/property_images/verification/1/id_back.jpg",
      idFrontImage: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758675859/property_images/verification/1/id_front.jpg",
      idNumber: "11111111",
      idType: "national_id",
      isVerified: true,
      languages: ["Français", "Anglais", "Arabe"],
      lastName: "Dhmine",
      password: "",
      properties: null,
      pushTokens: ["ExponentPushToken[TfYTvYBeA8mpJVduwEWhL5]"],
      savedProperties: [8, 9, 10],
      selfieImage: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758675862/property_images/verification/1/selfie.jpg",
      socialLogin: true,
      socialProvider: "Apple",
      verificationStatus: "verified"
    },
    hostID: 1,
    hostedFor: "",
    id: 23,
    identityVerified: false,
    language: "Arabic",
    maxAge: 13,
    minAge: 6,
    photos: [
      {
        caption: "",
        order: 1,
        url: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758315397/u7visuocnqe7mzvurry2.png"
      },
      {
        caption: "",
        order: 2,
        url: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758315407/mf9pdramnntmifeisakx.jpg"
      },
      {
        caption: "",
        order: 3,
        url: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758315416/wu8pjpm0dsb1sxsgdger.jpg"
      },
      {
        caption: "",
        order: 4,
        url: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758315423/h357dclm6e05okyp2qbp.jpg"
      },
      {
        caption: "",
        order: 5,
        url: "https://res.cloudinary.com/djwnohmqm/image/upload/v1758315433/gbn0f2yx9f8ua6xcnpqa.jpg"
      }
    ],
    pricePerPerson: 400,
    reviewNotes: "Experience submitted for review. We will contact you within 5 hours.",
    reviewStatus: "pending",
    startTime: "09:00",
    status: "live",
    title: "Sunset camel nktt",
    updatedAt: "2025-09-19T23:14:25.062251+02:00",
    videoURL: "https://res.cloudinary.com/djwnohmqm/video/upload/v1758315490/drdqjxqysniw4gecfsjq.mov",
    whatToBring: "",
    whatWeDo: "Ce que nous allons faire demain\nDemain matin, nous irons prendre un café dans un petit bistrot au centre-ville. Ensuite, nous visiterons le musée d'art moderne pour découvrir une nouvelle exposition. L'après-midi, nous ferons une promenade au bord de la mer et nous prendrons des photos. Enfin, le soir, nous dînerons ensemble dans un restaurant traditionnel pour goûter des spécialités locales."
  };

  const e = experience || experienceData;
  const capacityLeft = (e.groupSize || e.capacity || e.Capacity || 8) - participants.length;
  const isHost = user?.ID === e.hostID || user?.ID === e.HostID;

  if (isLoading && !experienceData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  const formatPrice = (price: number) => `${price} MRU`;
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  const getCancellationPolicyText = (policy: string) => {
    switch (policy?.toLowerCase()) {
      case 'flexible':
        return 'Annulation gratuite jusqu\'à 24h avant le début';
      case 'moderate':
        return 'Annulation gratuite jusqu\'à 5 jours avant le début';
      case 'strict':
        return 'Annulation gratuite jusqu\'à 7 jours avant le début';
      default:
        return 'Politique d\'annulation flexible';
    }
  };

  const getMediaItems = () => {
    const items = [];
    if (e.videoURL) {
      items.push({ type: 'video', url: e.videoURL, id: 'demo-video' });
    }
    if (e.photos && Array.isArray(e.photos)) {
      e.photos.forEach((photo, index) => {
        if (photo && photo.url) {
          items.push({ type: 'image', url: photo.url, id: `photo-${index}` });
        }
      });
    }
    return items.length > 0 ? items : [{
      type: 'image',
      url: 'https://via.placeholder.com/400x300?text=No+Images+Available',
      id: 'placeholder-image'
    }];
  };

  const handleMediaScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const pageNum = Math.floor(contentOffset.x / viewSize.width);
    setCurrentImageIndex(pageNum);
  };

  const toggleVideoPlayback = async () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleInvite = () => {
    if (isHost) {
      (navigation as any).navigate('ExperienceEdit', { experienceId });
    } else {
      setShowInviteSheet(true);
    }
  };

  const handleReserve = () => {
    if (!selectedDate) {
      Alert.alert('Veuillez sélectionner une date', 'Choisissez une date disponible dans le calendrier ci-dessus.');
      return;
    }
    (navigation as any).navigate('ExperienceBookingConfirmation', {
      experienceId,
      selectedDate,
      selectedTime: e.startTime,
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={COLORS.text.primary} weight="regular" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={() => setIsLiked(!isLiked)}>
              <Heart size={20} color={isLiked ? COLORS.primary : COLORS.text.primary} weight={isLiked ? "fill" : "regular"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Share size={20} color={COLORS.text.primary} weight="regular" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Media Gallery */}
          <View style={styles.mediaContainer}>
            <FlatList
              ref={flatListRef}
              data={getMediaItems()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleMediaScroll}
              scrollEventThrottle={16}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.mediaItem}>
                  {item.type === 'image' ? (
                    <Image source={{ uri: item.url }} style={styles.mediaImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.videoContainer}>
                      <Video
                        ref={videoRef}
                        source={{ uri: item.url }}
                        style={styles.mediaImage}
                        useNativeControls={false}
                        resizeMode="cover"
                        shouldPlay={false}
                        isLooping={true}
                        onPlaybackStatusUpdate={(status) => {
                          if (status.isLoaded) {
                            setIsVideoPlaying(status.isPlaying || false);
                          }
                        }}
                      />
                      <TouchableOpacity style={styles.playButton} onPress={toggleVideoPlayback}>
                        {isVideoPlaying ? (
                          <Pause size={20} color={COLORS.text.primary} weight="fill" />
                        ) : (
                          <Play size={20} color={COLORS.text.primary} weight="fill" />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            />
            
            {/* Media Counter */}
            <View style={styles.mediaCounter}>
              <Text style={styles.mediaCounterText}>
                {currentImageIndex + 1} / {getMediaItems().length}
              </Text>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Title and Location */}
            <View style={styles.section}>
              <Text style={styles.title}>{e.title || 'Experience Title'}</Text>
              <View style={styles.metaRow}>
                <View style={styles.ratingContainer}>
                  <Star size={14} color={COLORS.text.primary} weight="fill" />
                  <Text style={styles.ratingText}>4.8</Text>
                  <Text style={styles.reviewCount}>(24 avis)</Text>
                </View>
                <Text style={styles.metaDivider}>·</Text>
                <Text style={styles.location}>{e.city}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Host Info */}
            <View style={styles.section}>
              <View style={styles.hostContainer}>
                <Image source={{ uri: e.host?.avatarURL }} style={styles.hostAvatar} />
                <View style={styles.hostInfo}>
                  <View style={styles.hostNameRow}>
                    <Text style={styles.hostName}>Animé par {e.host?.firstName}</Text>
                    {e.host?.isVerified && (
                      <Shield size={14} color={COLORS.success} weight="fill" />
                    )}
                  </View>
                  <Text style={styles.hostMeta}>Membre depuis 2024</Text>
                </View>
              </View>
              {e.host?.languages && (
                <View style={styles.languageContainer}>
                  <Text style={styles.languageLabel}>Langues: </Text>
                  <Text style={styles.languageText}>{e.host.languages.join(', ')}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Key Details */}
            <View style={styles.section}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Clock size={20} color={COLORS.text.primary} weight="regular" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Durée</Text>
                  <Text style={styles.detailValue}>{formatDuration(e.duration)}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Users size={20} color={COLORS.text.primary} weight="regular" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Taille du groupe</Text>
                  <Text style={styles.detailValue}>Jusqu'à {e.groupSize} personnes</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Calendar size={20} color={COLORS.text.primary} weight="regular" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Horaires</Text>
                  <Text style={styles.detailValue}>{e.startTime} – {e.endTime}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <GlobeIcon size={20} color={COLORS.text.primary} weight="regular" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Langue</Text>
                  <Text style={styles.detailValue}>{e.language}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>À propos de cette expérience</Text>
              <Text style={styles.bodyText}>{e.description}</Text>
            </View>

            <View style={styles.divider} />

            {/* What's Included */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ce qui est inclus</Text>
              <View style={styles.includedList}>
                <View style={styles.includedItem}>
                  <Check size={16} color={COLORS.text.primary} weight="regular" />
                  <Text style={styles.includedText}>Guide professionnel</Text>
                </View>
                <View style={styles.includedItem}>
                  <Check size={16} color={COLORS.text.primary} weight="regular" />
                  <Text style={styles.includedText}>Équipement nécessaire</Text>
                </View>
                <View style={styles.includedItem}>
                  <Check size={16} color={COLORS.text.primary} weight="regular" />
                  <Text style={styles.includedText}>Rafraîchissements</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />
            
            
            {/* ADD WHAT WE WILL DO HERE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ce que nous allons faire</Text>
              <Text style={styles.bodyText}>{e.whatWeDo}</Text>
            </View>
            
            <View style={styles.divider} />

            {/* Availability Calendar */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sélectionnez une date</Text>
              <ProfessionalAvailabilityCalendar 
                experienceId={experienceId} 
                isHost={false}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
              />
            </View>

            <View style={styles.divider} />

            {/* Cancellation Policy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Politique d'annulation</Text>
              <Text style={styles.bodyText}>{getCancellationPolicyText(e.cancellationPolicy)}</Text>
            </View>

            <View style={styles.divider} />

            {/* Contact Host */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.contactButton}>
                <Phone size={18} color={COLORS.text.primary} weight="regular" />
                <Text style={styles.contactText}>Contacter l'hôte</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>

        {/* Fixed Booking Bar */}
        <View style={styles.bookingBar}>
          <View style={styles.bookingBarContent}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatPrice(e.pricePerPerson)}</Text>
              <Text style={styles.priceUnit}>par personne</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.reserveButton, capacityLeft === 0 && styles.reserveButtonDisabled]}
              onPress={handleReserve}
              disabled={capacityLeft === 0}
            >
              <Text style={styles.reserveText}>
                {capacityLeft === 0 ? 'Complet' : 'Réserver'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Invite Bottom Sheet */}
      <Modal visible={showInviteSheet} transparent animationType="slide" onRequestClose={() => setShowInviteSheet(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowInviteSheet(false)} />
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Inviter des amis</Text>
          <Text style={styles.modalSubtitle}>Créer un groupe pour cette expérience</Text>

          <TouchableOpacity
            style={styles.modalPrimaryButton}
            onPress={() => {
              setShowInviteSheet(false);
              (navigation as any).navigate('GroupOnboarding', { experienceId });
            }}
          >
            <Text style={styles.modalPrimaryText}>Créer un groupe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalSecondaryButton}
            onPress={() => {
              setShowInviteSheet(false);
              (navigation as any).navigate('MyGroups');
            }}
          >
            <Text style={styles.modalSecondaryText}>Voir mes groupes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowInviteSheet(false)}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 100,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  mediaContainer: {
    position: 'relative',
    height: 300,
  },
  mediaItem: {
    width: width,
    height: 300,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaCounter: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  mediaCounterText: {
    color: COLORS.background.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
  },
  section: {
    paddingVertical: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  metaDivider: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginHorizontal: 8,
  },
  location: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  hostInfo: {
    flex: 1,
  },
  hostNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  hostMeta: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  languageText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text.primary,
  },
  includedList: {
    gap: 16,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  includedText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.text.primary,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  bottomSpacing: {
    height: 100,
  },
  bookingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  bookingBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  priceUnit: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  reserveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  reserveButtonDisabled: {
    backgroundColor: COLORS.text.tertiary,
  },
  reserveText: {
    color: COLORS.background.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 32,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 24,
  },
  modalPrimaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPrimaryText: {
    color: COLORS.background.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSecondaryButton: {
    backgroundColor: COLORS.background.secondary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalSecondaryText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.text.secondary,
    fontSize: 16,
  },
});