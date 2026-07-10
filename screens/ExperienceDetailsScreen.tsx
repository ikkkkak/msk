// // // import React from 'react';
// // // import { View, StyleSheet, TouchableOpacity, Text, Image, ScrollView, Alert } from 'react-native';
// // // import { MaterialIcons } from '@expo/vector-icons';
// // // import { Screen } from '../components/Screen';
// // // import { useNavigation, useRoute } from '@react-navigation/native';
// // // import { useExperienceDetailsQuery } from '../hooks/queries/useExperienceDetailsQuery';

// // // export const ExperienceDetailsScreen = () => {
// // //   const navigation = useNavigation();
// // //   const route = useRoute();
// // //   const { experienceId } = route.params as { experienceId: number };
  
// // //   const { data: experience, isLoading } = useExperienceDetailsQuery(experienceId);

// // //   if (isLoading) {
// // //     return (
// // //       <Screen style={styles.container}>
// // //         <View style={styles.loadingContainer}>
// // //           <Text>Chargement...</Text>
// // //         </View>
// // //       </Screen>
// // //     );
// // //   }

// // //   if (!experience) {
// // //     return (
// // //       <Screen style={styles.container}>
// // //         <View style={styles.errorContainer}>
// // //           <Text style={styles.errorText}>Expérience non trouvée</Text>
// // //         </View>
// // //       </Screen>
// // //     );
// // //   }

// // //   const formatPrice = (price: number) => {
// // //     return `${price} MRU`;
// // //   };

// // //   const formatDuration = (minutes: number) => {
// // //     const hours = Math.floor(minutes / 60);
// // //     const mins = minutes % 60;
// // //     if (hours > 0 && mins > 0) {
// // //       return `${hours}h ${mins}min`;
// // //     } else if (hours > 0) {
// // //       return `${hours}h`;
// // //     } else {
// // //       return `${mins}min`;
// // //     }
// // //   };

// // //   const getStatusColor = (status: string) => {
// // //     switch (status) {
// // //       case 'live':
// // //         return '#00A699';
// // //       case 'pending':
// // //         return '#FF8C00';
// // //       case 'draft':
// // //         return '#717171';
// // //       case 'rejected':
// // //         return '#FF5A5F';
// // //       default:
// // //         return '#717171';
// // //     }
// // //   };

// // //   const getStatusText = (status: string) => {
// // //     switch (status) {
// // //       case 'live':
// // //         return 'En ligne';
// // //       case 'pending':
// // //         return 'En attente';
// // //       case 'draft':
// // //         return 'Brouillon';
// // //       case 'rejected':
// // //         return 'Rejeté';
// // //       default:
// // //         return status;
// // //     }
// // //   };

// // //   const firstPhoto = experience.photos && experience.photos.length > 0 ? experience.photos[0] : null;

// // //   return (
// // //     <Screen style={styles.container}>
// // //       {/* Header */}
// // //       <View style={styles.header}>
// // //         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
// // //           <MaterialIcons name="arrow-back" size={24} color="#222222" />
// // //         </TouchableOpacity>
// // //         <Text style={styles.headerTitle}>Détails de l'expérience</Text>
// // //         <View style={styles.placeholder} />
// // //       </View>

// // //       <ScrollView showsVerticalScrollIndicator={false}>
// // //         {/* Image */}
// // //         <View style={styles.imageContainer}>
// // //           {firstPhoto ? (
// // //             <Image source={{ uri: firstPhoto.url }} style={styles.experienceImage} />
// // //           ) : (
// // //             <View style={styles.placeholderImage}>
// // //               <MaterialIcons name="image" size={60} color="#DDDDDD" />
// // //             </View>
// // //           )}
// // //           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(experience.status) }]}>
// // //             <Text style={styles.statusText}>{getStatusText(experience.status)}</Text>
// // //           </View>
// // //         </View>

// // //         {/* Content */}
// // //         <View style={styles.content}>
// // //           {/* Title and Price */}
// // //           <View style={styles.titleSection}>
// // //             <Text style={styles.title}>{experience.title}</Text>
// // //             <View style={styles.priceContainer}>
// // //               <Text style={styles.price}>{formatPrice(experience.pricePerPerson)}</Text>
// // //               <Text style={styles.priceUnit}>par personne</Text>
// // //             </View>
// // //           </View>

// // //           {/* Basic Info */}
// // //           <View style={styles.infoSection}>
// // //             <View style={styles.infoItem}>
// // //               <MaterialIcons name="location-on" size={20} color="#00A699" />
// // //               <Text style={styles.infoText}>{experience.city}</Text>
// // //             </View>
            
// // //             <View style={styles.infoItem}>
// // //               <MaterialIcons name="schedule" size={20} color="#00A699" />
// // //               <Text style={styles.infoText}>{formatDuration(experience.duration)}</Text>
// // //             </View>
            
// // //             <View style={styles.infoItem}>
// // //               <MaterialIcons name="group" size={20} color="#00A699" />
// // //               <Text style={styles.infoText}>Max {experience.groupSize} personnes</Text>
// // //             </View>
            
// // //             <View style={styles.infoItem}>
// // //               <MaterialIcons name="language" size={20} color="#00A699" />
// // //               <Text style={styles.infoText}>{experience.language}</Text>
// // //             </View>
// // //           </View>

// // //           {/* Description */}
// // //           {experience.description && (
// // //             <View style={styles.section}>
// // //               <Text style={styles.sectionTitle}>Description</Text>
// // //               <Text style={styles.sectionContent}>{experience.description}</Text>
// // //             </View>
// // //           )}

// // //           {/* What We'll Do */}
// // //           {experience.whatWeDo && (
// // //             <View style={styles.section}>
// // //               <Text style={styles.sectionTitle}>Ce que nous ferons</Text>
// // //               <Text style={styles.sectionContent}>{experience.whatWeDo}</Text>
// // //             </View>
// // //           )}

// // //           {/* Requirements */}
// // //           <View style={styles.section}>
// // //             <Text style={styles.sectionTitle}>Exigences</Text>
            
// // //             <View style={styles.requirementItem}>
// // //               <MaterialIcons name="person" size={16} color="#717171" />
// // //               <Text style={styles.requirementText}>
// // //                 Âge: {experience.minAge} - {experience.maxAge} ans
// // //               </Text>
// // //             </View>
            
// // //             <View style={styles.requirementItem}>
// // //               <MaterialIcons name="fitness-center" size={16} color="#717171" />
// // //               <Text style={styles.requirementText}>
// // //                 Niveau d'activité: {experience.activityLevel}
// // //               </Text>
// // //             </View>
            
// // //             <View style={styles.requirementItem}>
// // //               <MaterialIcons name="school" size={16} color="#717171" />
// // //               <Text style={styles.requirementText}>
// // //                 Difficulté: {experience.difficultyLevel}
// // //               </Text>
// // //             </View>
// // //           </View>

// // //           {/* What to Bring */}
// // //           {experience.whatToBring && (
// // //             <View style={styles.section}>
// // //               <Text style={styles.sectionTitle}>À apporter</Text>
// // //               <Text style={styles.sectionContent}>{experience.whatToBring}</Text>
// // //             </View>
// // //           )}

// // //           {/* Timing */}
// // //           <View style={styles.section}>
// // //             <Text style={styles.sectionTitle}>Horaires</Text>
// // //             <View style={styles.timingItem}>
// // //               <MaterialIcons name="schedule" size={16} color="#717171" />
// // //               <Text style={styles.timingText}>
// // //                 {experience.startTime} - {experience.endTime}
// // //               </Text>
// // //             </View>
// // //             <View style={styles.timingItem}>
// // //               <MaterialIcons name="access-time" size={16} color="#717171" />
// // //               <Text style={styles.timingText}>
// // //                 Arrivée {experience.arrivalTime} minutes avant le début
// // //               </Text>
// // //             </View>
// // //           </View>

// // //           {/* Cancellation Policy */}
// // //           <View style={styles.section}>
// // //             <Text style={styles.sectionTitle}>Politique d'annulation</Text>
// // //             <Text style={styles.sectionContent}>{experience.cancellationPolicy}</Text>
// // //           </View>
// // //         </View>
// // //       </ScrollView>
// // //     </Screen>
// // //   );
// // // };

// // // const styles = StyleSheet.create({
// // //   container: {
// // //     flex: 1,
// // //     backgroundColor: '#FFFFFF',
// // //   },
// // //   header: {
// // //     flexDirection: 'row',
// // //     alignItems: 'center',
// // //     justifyContent: 'space-between',
// // //     paddingHorizontal: 20,
// // //     paddingVertical: 16,
// // //     borderBottomWidth: 1,
// // //     borderBottomColor: '#F0F0F0',
// // //   },
// // //   backButton: {
// // //     padding: 8,
// // //   },
// // //   headerTitle: {
// // //     fontSize: 18,
// // //     fontWeight: '600',
// // //     color: '#222222',
// // //   },
// // //   placeholder: {
// // //     width: 40,
// // //   },
// // //   loadingContainer: {
// // //     flex: 1,
// // //     justifyContent: 'center',
// // //     alignItems: 'center',
// // //   },
// // //   errorContainer: {
// // //     flex: 1,
// // //     justifyContent: 'center',
// // //     alignItems: 'center',
// // //   },
// // //   errorText: {
// // //     fontSize: 16,
// // //     color: '#717171',
// // //   },
// // //   imageContainer: {
// // //     position: 'relative',
// // //     height: 250,
// // //   },
// // //   experienceImage: {
// // //     width: '100%',
// // //     height: '100%',
// // //     resizeMode: 'cover',
// // //   },
// // //   placeholderImage: {
// // //     width: '100%',
// // //     height: '100%',
// // //     backgroundColor: '#F7F7F7',
// // //     justifyContent: 'center',
// // //     alignItems: 'center',
// // //   },
// // //   statusBadge: {
// // //     position: 'absolute',
// // //     top: 16,
// // //     right: 16,
// // //     paddingHorizontal: 12,
// // //     paddingVertical: 6,
// // //     borderRadius: 16,
// // //   },
// // //   statusText: {
// // //     fontSize: 14,
// // //     fontWeight: '600',
// // //     color: '#FFFFFF',
// // //   },
// // //   content: {
// // //     padding: 20,
// // //   },
// // //   titleSection: {
// // //     marginBottom: 24,
// // //   },
// // //   title: {
// // //     fontSize: 24,
// // //     fontWeight: '700',
// // //     color: '#222222',
// // //     marginBottom: 8,
// // //     lineHeight: 32,
// // //   },
// // //   priceContainer: {
// // //     flexDirection: 'row',
// // //     alignItems: 'baseline',
// // //   },
// // //   price: {
// // //     fontSize: 28,
// // //     fontWeight: '700',
// // //     color: '#00A699',
// // //   },
// // //   priceUnit: {
// // //     fontSize: 16,
// // //     color: '#717171',
// // //     marginLeft: 8,
// // //   },
// // //   infoSection: {
// // //     marginBottom: 24,
// // //   },
// // //   infoItem: {
// // //     flexDirection: 'row',
// // //     alignItems: 'center',
// // //     marginBottom: 12,
// // //   },
// // //   infoText: {
// // //     fontSize: 16,
// // //     color: '#222222',
// // //     marginLeft: 12,
// // //   },
// // //   section: {
// // //     marginBottom: 24,
// // //   },
// // //   sectionTitle: {
// // //     fontSize: 18,
// // //     fontWeight: '600',
// // //     color: '#222222',
// // //     marginBottom: 12,
// // //   },
// // //   sectionContent: {
// // //     fontSize: 16,
// // //     color: '#717171',
// // //     lineHeight: 24,
// // //   },
// // //   requirementItem: {
// // //     flexDirection: 'row',
// // //     alignItems: 'center',
// // //     marginBottom: 8,
// // //   },
// // //   requirementText: {
// // //     fontSize: 14,
// // //     color: '#717171',
// // //     marginLeft: 12,
// // //   },
// // //   timingItem: {
// // //     flexDirection: 'row',
// // //     alignItems: 'center',
// // //     marginBottom: 8,
// // //   },
// // //   timingText: {
// // //     fontSize: 14,
// // //     color: '#717171',
// // //     marginLeft: 12,
// // //   },
// // // });

// // import React, { useState } from 'react';
// // import { View, StyleSheet, TouchableOpacity, Text, Image, ScrollView, Dimensions, StatusBar } from 'react-native';
// // import { Screen } from '../components/Screen';
// // import { useNavigation, useRoute } from '@react-navigation/native';
// // import { useExperienceDetailsQuery } from '../hooks/queries/useExperienceDetailsQuery';
// // // Import Phosphor Icons - replace with your actual phosphor-react-native import
// // import { 
// //   ArrowLeft, 
// //   MapPin, 
// //   Clock, 
// //   Users, 
// //   Globe,
// //   Person,
// //   Share,
// //   Heart,
// //   Star,
// //   MeteorIcon,
// //   HandTapIcon
// // } from 'phosphor-react-native';
// // import { InviteModal } from '../components/InviteModal';
// // import { useExperienceParticipants, useListAvailability } from '../hooks/queries/useExperienceInvites';
// // import { useUser } from '../hooks/useUser';
// // // import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
// // import { AvailabilityCalendar } from '../components/CalendarWithoutHooks';

// // const { width } = Dimensions.get('window');

// // export const ExperienceDetailsScreen = () => {
// //   const navigation = useNavigation();
// //   const route = useRoute();
// //   const { experienceId } = route.params as { experienceId: number };
// //   const [currentImageIndex, setCurrentImageIndex] = useState(0);
// //   const [isLiked, setIsLiked] = useState(false);
// //   const [inviteVisible, setInviteVisible] = useState(false);
  
// //   const { data: experience, isLoading } = useExperienceDetailsQuery(experienceId);
// //   const { data: participants = [] } = useExperienceParticipants(experienceId);
// //   const { data: availability = [] } = useListAvailability(experienceId);
// //   const { user } = useUser();

// //   if (isLoading) {
// //     return (
// //       <View style={styles.container}>
// //         <View style={styles.loadingContainer}>
// //           <Text style={styles.bodyText}>Loading...</Text>
// //         </View>
// //       </View>
// //     );
// //   }

// //   if (!experience) {
// //     return (
// //       <View style={styles.container}>
// //         <View style={styles.loadingContainer}>
// //           <Text style={styles.bodyText}>Experience not found</Text>
// //         </View>
// //       </View>
// //     );
// //   }

// //   const formatPrice = (price: number) => `${price} MRU`;
  
// //   const formatDuration = (minutes: number) => {
// //     const hours = Math.floor(minutes / 60);
// //     const mins = minutes % 60;
// //     if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
// //     if (hours > 0) return `${hours}h`;
// //     return `${mins}min`;
// //   };

// //   const getActivityLevel = (level: string) => {
// //     const levels: Record<string, string> = { light: 'Light', moderate: 'Moderate', intense: 'Intense' };
// //     return levels[level] || level;
// //   };

// //   const getDifficulty = (level: string) => {
// //     const levels: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
// //     return levels[level] || level;
// //   };

// //   const e: any = experience as any;
// //   const photos = e.photos || [];
// //   const groupSize = e.groupSize || e.GroupSize || 0;
// //   const joinedCount = Array.isArray(participants) ? participants.length : 0;
// //   const capacityLeft = Math.max(0, groupSize - joinedCount);

// //   return (
// //     <View style={styles.container}>
// //       <StatusBar barStyle="light-content" />
// //               {/* Minimal Header Overlay */}
// //               <View style={styles.headerOverlay}>
// //           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
// //             <ArrowLeft size={20} color="#000" weight="regular" />
// //           </TouchableOpacity>
// //           <View style={styles.headerActions}>
// //             <TouchableOpacity style={styles.headerButton}>
// //               <Share size={18} color="#000" weight="regular" />
// //             </TouchableOpacity>
// //             <TouchableOpacity 
// //               style={styles.headerButton}
// //               onPress={() => setIsLiked(!isLiked)}
// //             >
// //               <Heart 
// //                 size={18} 
// //                 color={isLiked ? "#FF385C" : "#000"} 
// //                 weight={isLiked ? "fill" : "regular"} 
// //               />
// //             </TouchableOpacity>
// //           </View>
// //         </View>
// //       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      
// //       {/* Hero Image Section */}
// //       <View style={styles.heroSection}>
// //         {photos.length > 0 ? (
// //           <ScrollView 
// //             horizontal 
// //             pagingEnabled 
// //             showsHorizontalScrollIndicator={false}
// //             onScroll={(e) => {
// //               const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
// //               setCurrentImageIndex(newIndex);
// //             }}
// //             scrollEventThrottle={16}
// //           >
// //             {photos.map((photo: any, index: number) => (
// //               <Image 
// //                 key={index}
// //                 source={{ uri: photo.url }} 
// //                 style={styles.heroImage} 
// //               />
// //             ))}
// //           </ScrollView>
// //         ) : (
// //           <View style={styles.heroPlaceholder}>
// //             <View style={styles.placeholderContent}>
// //               <Text style={styles.placeholderEmoji}>📷</Text>
// //             </View>
// //           </View>
// //         )}
        


// //         {/* Subtle Image Counter */}
// //         {photos.length > 1 && (
// //           <View style={styles.imageCounter}>
// //             <Text style={styles.counterText}>{currentImageIndex + 1} / {photos.length}</Text>
// //           </View>
// //         )}
// //       </View>

// //         {/* Main Content */}
// //         <View style={styles.mainContent}>
          
// //           {/* Title & Location */}
// //           <View style={styles.titleSection}>
// //             <Text style={styles.title}>{experience.title}</Text>
// //             <View style={styles.locationRow}>
// //               <MapPin size={14} color="#6A6A6A" weight="regular" />
// //               <Text style={styles.locationText}>{experience.city}</Text>
// //             </View>
// //           </View>

// //           {/* Host Section */}
// //           <View style={styles.hostSection}>
// //             <Image 
// //               source={{ uri: e.host?.avatarURL || e.Host?.AvatarURL }} 
// //               style={styles.hostAvatar}
// //             />
// //             <View style={styles.hostInfo}>
// //               <Text style={styles.hostName}>
// //                 Hosted by {e.host?.firstName || e.Host?.FirstName || 'Host'}
// //               </Text>
// //               {/* <View style={styles.hostRating}>
// //                 <Star size={12} color="#FF385C" weight="fill" />
// //                 <Text style={styles.ratingText}>4.94 · 203 reviews</Text>
// //               </View> */}
// //             </View>
// //           </View>

// //           {/* Participants Row */}
// //           {groupSize > 0 && (
// //             <View style={styles.participantsRow}>
// //               <View style={styles.avatarStack}>
// //                 {((participants as any[]) || []).slice(0, 7).map((p: any, idx: number) => (
// //                   <Image
// //                     key={String(p.ID || p.id || idx)}
// //                     source={{ uri: p?.User?.AvatarURL || p?.user?.avatarURL || 'https://i.pravatar.cc/100' }}
// //                     style={[styles.participantAvatar, { left: idx * 16, zIndex: 20 - idx }]}
// //                   />
// //                 ))}
// //               </View>
// //               <Text style={styles.capacityText}>{joinedCount}/{groupSize}</Text>
// //             </View>
// //           )}

// //           {/* Key Info Grid */}
// //           <View style={styles.infoGrid}>
// //             <View style={styles.infoItem}>
// //               <Clock size={16} color="#222" weight="regular" />
// //               <Text style={styles.infoText}>{formatDuration(e.duration || e.Duration || 60)}</Text>
// //             </View>
// //             <View style={styles.infoItem}>
// //               <Users size={16} color="#222" weight="regular" />
// //               <Text style={styles.infoText}>Up to {groupSize} guests</Text>
// //             </View>
// //             <View style={styles.infoItem}>
// //               <Globe size={16} color="#222" weight="regular" />
// //               <Text style={styles.infoText}>Hosted in {e.language || e.Language}</Text>
// //             </View>
// //           </View>

// //           {/* Divider */}

// //           {e.Description && (
// //             <>
// //             <View style={styles.divider} />
// //               <View style={styles.section}>
// //                 <Text style={styles.sectionTitle}>Description</Text>
// //                 <Text style={styles.sectionText}>{e.Description}</Text>
// //               </View>
// //               <View style={styles.divider} />
// //             </>
// //           )}


// //           {/* What we'll do */}
// //           {(e.whatWeDo || e.WhatWeDo) && (
// //             <>
// // <View style={styles.divider} />
// //               <View style={styles.section}>
// //                 <Text style={styles.sectionTitle}>What we'll do</Text>
// //                 <Text style={styles.sectionText}>{e.whatWeDo || e.WhatWeDo}</Text>
// //               </View>
// //               <View style={styles.divider} />
// //             </>
// //           )}

// //           {/* Requirements */}
// //           <View style={styles.section}>
// //             <Text style={styles.sectionTitle}>Guest requirements</Text>
            
// //             <View style={styles.requirementsList}>
// //               <View style={styles.requirement}>
// //                 <Person size={16} color="#6A6A6A" weight="regular" />
// //                 <Text style={styles.requirementText}>
// //                 Ages {(e.minAge ?? e.MinAge) ?? 0}–{(e.maxAge ?? e.MaxAge) ?? 0}
// //                 </Text>
// //               </View>
              
// //               <View style={styles.requirement}>
// //                 <MeteorIcon size={16} color="#6A6A6A" weight="regular" />
// //                 <Text style={styles.requirementText}>
// //                   {getActivityLevel((e.activityLevel || e.ActivityLevel) ?? '')} activity level
// //                 </Text>
// //               </View>
              
// //               <View style={styles.requirement}>
// //                 <HandTapIcon size={16} color="#6A6A6A" weight="regular" />
// //                 <Text style={styles.requirementText}>
// //                   {getDifficulty((e.difficultyLevel || e.DifficultyLevel) ?? '')} level
// //                 </Text>
// //               </View>
// //             </View>
// //           </View>

// //           <View style={styles.divider} />

// //           {/* What to bring */}
// //           {(e.whatToBring || e.WhatToBring) && (
// //             <>
// //               <View style={styles.section}>
// //                 <Text style={styles.sectionTitle}>What to bring</Text>
// //                 <Text style={styles.sectionText}>{e.whatToBring || e.WhatToBring}</Text>
// //               </View>
// //               <View style={styles.divider} />
// //             </>
// //           )}

// //           {/* Schedule */}
// //           <View style={styles.section}>
// //             <Text style={styles.sectionTitle}>Schedule</Text>
// //             <View style={styles.scheduleInfo}>
// //               <Text style={styles.scheduleText}>
// //                 {(e.startTime || e.StartTime) ?? ''} – {(e.endTime || e.EndTime) ?? ''}
// //               </Text>
// //               <Text style={styles.scheduleSubtext}>
// //                 Please arrive {(e.arrivalTime || e.ArrivalTime) ?? 0} minutes early
// //               </Text>
// //             </View>
// //           </View>

// //           <View style={styles.divider} />

// //           {/* Availability Calendar */}
// //           <View style={{
// //             marginBottom: 32,
// //           }}>
// //             <Text style={{
// //               fontSize: 22,
// //               fontWeight: '600',
// //               color: '#222',
// //               marginBottom: 16,
// //               paddingHorizontal: 24,
// //             }}>Available dates</Text>
// //             <AvailabilityCalendar experienceId={experienceId} isHost={false} />
// //           </View>

// //           <View style={styles.divider} />

// //           {/* Cancellation */}
// //           <View style={styles.section}>
// //             <Text style={styles.sectionTitle}>Cancellation policy</Text>
// //             <Text style={styles.sectionText}>
// //               {(e.cancellationPolicy || e.CancellationPolicy) === 'flexible' 
// //                 ? 'Cancel up to 24 hours before the experience starts for a full refund.'
// //                 : (e.cancellationPolicy || e.CancellationPolicy)
// //               }
// //             </Text>
// //           </View>

// //           <View style={styles.bottomSpacing} />
// //         </View>
// //       </ScrollView>

// //       {/* Fixed Booking Bar */}
// //       <View style={styles.bookingBar}>
// //         <View style={styles.priceInfo}>
// //           <Text style={styles.finalPrice}>{formatPrice(e.pricePerPerson || e.PricePerPerson || 0)}</Text>
// //           <Text style={styles.priceLabel}>per person</Text>
// //         </View>
        
// //         {/* Show Edit button for host, Invite button for guests */}
// //         {user?.ID === e.hostID || user?.ID === e.HostID ? (
// //           <TouchableOpacity
// //             style={styles.editButton}
// //             onPress={() => (navigation as any).navigate('ExperienceEdit', { experienceId })}
// //           >
// //             <Text style={styles.editText}>Edit</Text>
// //           </TouchableOpacity>
// //         ) : (
// //           <TouchableOpacity
// //             style={[styles.inviteButton, capacityLeft === 0 && styles.inviteButtonDisabled]}
// //             onPress={() => (navigation as any).navigate('GroupOnboarding', { experienceId, capacityLeft })}
// //             disabled={capacityLeft === 0}
// //           >
// //             <Text style={[styles.inviteText, capacityLeft === 0 && styles.inviteTextDisabled]}>
// //               {capacityLeft > 0 ? 'Invite' : 'Full'}
// //             </Text>
// //           </TouchableOpacity>
// //         )}
        
// //         <TouchableOpacity style={styles.reserveButton}>
// //           <Text style={styles.reserveText}>Reserve</Text>
// //         </TouchableOpacity>
// //       </View>
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#fff',
// //   },
// //   loadingContainer: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   heroSection: {
// //     height: 300,
// //     position: 'relative',
// //   },
// //   heroImage: {
// //     width: width,
// //     height: 300,
// //     resizeMode: 'cover',
// //   },
// //   heroPlaceholder: {
// //     width: '100%',
// //     height: 300,
// //     backgroundColor: '#F7F7F7',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   placeholderContent: {
// //     alignItems: 'center',
// //   },
// //   placeholderEmoji: {
// //     fontSize: 48,
// //     opacity: 0.3,
// //   },
// //   headerOverlay: {
// //     position: 'absolute',
// //     top: 44,
// //     zIndex: 100,
// //     left: 0,
// //     right: 0,
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     paddingHorizontal: 24,
// //   },
// //   headerButton: {
// //     width: 32,
// //     height: 32,
// //     borderRadius: 16,
// //     backgroundColor: 'rgba(255, 255, 255, 0.9)',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   headerActions: {
// //     flexDirection: 'row',
// //     gap: 8,
// //   },
// //   imageCounter: {
// //     position: 'absolute',
// //     bottom: 16,
// //     right: 16,
// //     backgroundColor: 'rgba(0, 0, 0, 0.6)',
// //     paddingHorizontal: 8,
// //     paddingVertical: 4,
// //     borderRadius: 12,
// //   },
// //   counterText: {
// //     color: '#fff',
// //     fontSize: 12,
// //     fontWeight: '500',
// //   },
// //   content: {
// //     flex: 1,
// //   },
// //   mainContent: {
// //     paddingTop: 24,
// //   },
// //   titleSection: {
// //     paddingHorizontal: 24,
// //     marginBottom: 20,
// //   },
// //   title: {
// //     fontSize: 26,
// //     fontWeight: '600',
// //     color: '#222',
// //     lineHeight: 30,
// //     marginBottom: 4,
// //   },
// //   locationRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 4,
// //   },
// //   locationText: {
// //     fontSize: 16,
// //     color: '#6A6A6A',
// //   },
// //   hostSection: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     paddingHorizontal: 24,
// //     marginBottom: 24,
// //   },
// //   participantsRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //     paddingHorizontal: 24,
// //     marginBottom: 20,
// //   },
// //   avatarStack: {
// //     height: 28,
// //     flexDirection: 'row',
// //     position: 'relative',
// //   },
// //   participantAvatar: {
// //     width: 28,
// //     height: 28,
// //     borderRadius: 14,
// //     backgroundColor: '#EEE',
// //     position: 'absolute',
// //     borderWidth: 2,
// //     borderColor: '#fff',
// //   },
// //   capacityText: {
// //     fontSize: 14,
// //     color: '#222',
// //     fontWeight: '600',
// //   },
// //   hostAvatar: {
// //     width: 40,
// //     height: 40,
// //     borderRadius: 20,
// //     marginRight: 12,
// //   },
// //   hostInfo: {
// //     flex: 1,
// //   },
// //   hostName: {
// //     fontSize: 16,
// //     fontWeight: '500',
// //     color: '#222',
// //     marginBottom: 2,
// //   },
// //   hostRating: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 4,
// //   },
// //   ratingText: {
// //     fontSize: 14,
// //     color: '#6A6A6A',
// //   },
// //   infoGrid: {
// //     paddingHorizontal: 24,
// //     gap: 16,
// //     marginBottom: 32,
// //   },
// //   infoItem: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 12,
// //   },
// //   infoText: {
// //     fontSize: 16,
// //     color: '#222',
// //   },
// //   divider: {
// //     height: 1,
// //     backgroundColor: '#EBEBEB',
// //     marginHorizontal: 24,
// //     marginBottom: 32,
// //   },
// //   section: {
// //     paddingHorizontal: 24,
// //     marginBottom: 32,
// //   },
// //   sectionTitle: {
// //     fontSize: 22,
// //     fontWeight: '600',
// //     color: '#222',
// //     marginBottom: 16,
// //   },
// //   sectionText: {
// //     fontSize: 16,
// //     lineHeight: 24,
// //     color: '#222',
// //   },
// //   requirementsList: {
// //     gap: 12,
// //   },
// //   requirement: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 12,
// //   },
// //   requirementText: {
// //     fontSize: 16,
// //     color: '#222',
// //   },
// //   scheduleInfo: {
// //     gap: 4,
// //   },
// //   scheduleText: {
// //     fontSize: 16,
// //     fontWeight: '500',
// //     color: '#222',
// //   },
// //   scheduleSubtext: {
// //     fontSize: 14,
// //     color: '#6A6A6A',
// //   },
// //   bodyText: {
// //     fontSize: 16,
// //     color: '#6A6A6A',
// //   },
// //   bottomSpacing: {
// //     height: 100,
// //   },
// //   bookingBar: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     paddingHorizontal: 24,
// //     paddingVertical: 16,
// //     backgroundColor: '#fff',
// //     borderTopWidth: 1,
// //     borderTopColor: '#EBEBEB',
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
// //     color: '#fff',
// //     fontSize: 14,
// //     fontWeight: '700',
// //   },
// //   inviteTextDisabled: {
// //     color: '#f8f8f8',
// //   },
// //   editButton: {
// //     backgroundColor: '#FF385C',
// //     paddingHorizontal: 16,
// //     paddingVertical: 12,
// //     borderRadius: 8,
// //     marginRight: 10,
// //   },
// //   editText: {
// //     color: '#fff',
// //     fontSize: 14,
// //     fontWeight: '700',
// //   },
// //   priceInfo: {
// //     flex: 1,
// //   },
// //   finalPrice: {
// //     fontSize: 22,
// //     fontWeight: '600',
// //     color: '#222',
// //   },
// //   priceLabel: {
// //     fontSize: 14,
// //     color: '#6A6A6A',
// //   },
// //   reserveButton: {
// //     backgroundColor: '#FF385C',
// //     paddingHorizontal: 24,
// //     paddingVertical: 14,
// //     borderRadius: 8,
// //   },
// //   reserveText: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#fff',
// //   },
// // });

// import React, { useState } from 'react';
// import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Dimensions, Alert } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useNavigation, useRoute } from '@react-navigation/native';
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
//   CheckIcon
// } from 'phosphor-react-native';
// import { useExperienceDetails } from '../hooks/queries/useExperienceDetails';
// import { useExperienceParticipants } from '../hooks/queries/useExperienceInvites';
// import { useUser } from '../hooks/useUser';
// import { ProfessionalAvailabilityCalendar } from '../components/ProfessionalAvailabilityCalendar';

// const { width } = Dimensions.get('window');

// export const ProfessionalExperienceDetailsScreen = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { experienceId } = route.params as { experienceId: number };
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [isLiked, setIsLiked] = useState(false);
//   const [selectedDate, setSelectedDate] = useState<string>('');
  
//   const { data: experience, isLoading } = useExperienceDetails(experienceId);
//   const { data: participants = [] } = useExperienceParticipants(experienceId);
//   const { user } = useUser();

//   if (isLoading) {
//     return (
//       <View style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <Text style={styles.loadingText}>Loading experience details...</Text>
//         </View>
//       </View>
//     );
//   }

//   if (!experience) {
//     return (
//       <View style={styles.container}>
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>Experience not found</Text>
//         </View>
//       </View>
//     );
//   }

//   const e = experience;
//   const capacityLeft = (e.capacity || e.Capacity || 0) - participants.length;
//   const isHost = user?.ID === e.hostID || user?.ID === e.HostID;

//   const formatPrice = (price: number) => {
//     return `$${price}`;
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
//         return 'Cancel up to 24 hours before check-in for a full refund';
//       case 'moderate':
//         return 'Cancel up to 5 days before check-in for a full refund';
//       case 'strict':
//         return 'Cancel up to 7 days before check-in for a 50% refund';
//       default:
//         return 'Cancellation policy varies';
//     }
//   };

//   const getAmenities = () => {
//     const amenities = [];
//     if (e.wifi || e.Wifi) amenities.push({ icon: WifiHigh, name: 'WiFi' });
//     if (e.parking || e.Parking) amenities.push({ icon: Car, name: 'Parking' });
//     if (e.food || e.Food) amenities.push({ icon: ForkKnife, name: 'Food & Drinks' });
//     if (e.photography || e.Photography) amenities.push({ icon: Camera, name: 'Photography' });
//     if (e.music || e.Music) amenities.push({ icon: MusicNote, name: 'Music' });
//     if (e.games || e.Games) amenities.push({ icon: GameController, name: 'Games' });
//     return amenities;
//   };

//   const handleDateSelect = (date: string) => {
//     setSelectedDate(date);
//     Alert.alert('Date Selected', `You selected ${date}. Proceed to booking?`);
//   };

//   const handleInvite = () => {
//     if (isHost) {
//       (navigation as any).navigate('ExperienceEdit', { experienceId });
//     } else {
//       (navigation as any).navigate('GroupOnboarding', { experienceId, capacityLeft });
//     }
//   };

//   const handleReserve = () => {
//     if (!selectedDate) {
//       // Show a simple date picker or allow user to select today's date
//       const today = new Date().toISOString().split('T')[0];
//       setSelectedDate(today);
//       Alert.alert(
//         'Date Selected', 
//         `Selected today's date (${today}). Proceed to booking?`,
//         [
//           { text: 'Cancel', style: 'cancel' },
//           { 
//             text: 'Continue', 
//             onPress: () => {
//               (navigation as any).navigate('ExperienceBookingConfirmation', {
//                 experienceId,
//                 selectedDate: today,
//                 selectedTime: '', // You can add time selection later
//               });
//             }
//           }
//         ]
//       );
//       return;
//     }
//     // Navigate to booking confirmation screen
//     (navigation as any).navigate('ExperienceBookingConfirmation', {
//       experienceId,
//       selectedDate,
//       selectedTime: '', // You can add time selection later
//     });
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
//           {/* Image Gallery */}
//           <View style={styles.imageContainer}>
//             <Image
//               source={{ uri: e.imageURL || e.ImageURL || 'https://via.placeholder.com/400x300' }}
//               style={styles.mainImage}
//               resizeMode="cover"
//             />
            
//             {/* Image Indicators */}
//             <View style={styles.imageIndicators}>
//               <View style={[styles.indicator, styles.activeIndicator]} />
//               <View style={styles.indicator} />
//               <View style={styles.indicator} />
//             </View>
//           </View>

//           {/* Main Content */}
//           <View style={styles.content}>
//             {/* Title and Rating */}
//             <View style={styles.titleSection}>
//               <Text style={styles.title}>{e.title || e.Title || 'Experience Title'}</Text>
//               <View style={styles.ratingRow}>
//                 <Star size={16} color="#FF385C" weight="fill" />
//                 <Text style={styles.rating}>{(e.rating || e.Rating || 4.8).toFixed(1)}</Text>
//                 <Text style={styles.reviewCount}>({e.reviewCount || e.ReviewCount || 24} reviews)</Text>
//               </View>
//             </View>

//             {/* Host Info */}
//             <View style={styles.hostSection}>
//               <Image
//                 source={{ uri: e.host?.avatarURL || 'https://i.pravatar.cc/100' }}
//                 style={styles.hostAvatar}
//               />
//               <View style={styles.hostInfo}>
//                 <Text style={styles.hostName}>Hosted by {e.host?.firstName || 'John'} {e.host?.lastName || 'Doe'}</Text>
//                 <Text style={styles.hostJoined}>Joined in {new Date().getFullYear()}</Text>
//               </View>
//             </View>

//             {/* Key Details */}
//             <View style={styles.detailsSection}>
//               <View style={styles.detailItem}>
//                 <MapPin size={20} color="#FF385C" weight="duotone" />
//                 <View style={styles.detailContent}>
//                   <Text style={styles.detailLabel}>Location</Text>
//                   <Text style={styles.detailValue}>{e.location || e.Location || 'Mauritania'}</Text>
//                 </View>
//               </View>

//               <View style={styles.detailItem}>
//                 <Clock size={20} color="#FF385C" weight="duotone" />
//                 <View style={styles.detailContent}>
//                   <Text style={styles.detailLabel}>Duration</Text>
//                   <Text style={styles.detailValue}>{formatDuration(e.duration || e.Duration || 120)}</Text>
//                 </View>
//               </View>

//               <View style={styles.detailItem}>
//                 <Users size={20} color="#FF385C" weight="duotone" />
//                 <View style={styles.detailContent}>
//                   <Text style={styles.detailLabel}>Group Size</Text>
//                   <Text style={styles.detailValue}>Up to {e.capacity || e.Capacity || 10} people</Text>
//                 </View>
//               </View>

//               <View style={styles.detailItem}>
//                 <Calendar size={20} color="#FF385C" weight="duotone" />
//                 <View style={styles.detailContent}>
//                   <Text style={styles.detailLabel}>Schedule</Text>
//                   <Text style={styles.detailValue}>
//                     {(e.startTime || e.StartTime) || '9:00 AM'} – {(e.endTime || e.EndTime) || '5:00 PM'}
//                   </Text>
//                 </View>
//               </View>
//             </View>

//             {/* Description */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>About this experience</Text>
//               <Text style={styles.description}>
//                 {e.description || e.Description || 'Join us for an amazing experience that will create lasting memories. This unique adventure combines local culture, beautiful scenery, and unforgettable moments.'}
//               </Text>
//             </View>

//             {/* What's Included */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>What's included</Text>
//               <View style={styles.includedList}>
//                 <View style={styles.includedItem}>
//                   <CheckIcon size={16} color="#00A699" weight="bold" />
//                   <Text style={styles.includedText}>All necessary equipment</Text>
//                 </View>
//                 <View style={styles.includedItem}>
//                   <CheckIcon size={16} color="#00A699" weight="bold" />
//                   <Text style={styles.includedText}>Professional guide</Text>
//                 </View>
//                 <View style={styles.includedItem}>
//                   <CheckIcon size={16} color="#00A699" weight="bold" />
//                   <Text style={styles.includedText}>Refreshments</Text>
//                 </View>
//                 <View style={styles.includedItem}>
//                   <CheckIcon size={16} color="#00A699" weight="bold" />
//                   <Text style={styles.includedText}>Transportation</Text>
//                 </View>
//               </View>
//             </View>

//             {/* Amenities */}
//             {getAmenities().length > 0 && (
//               <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Amenities</Text>
//                 <View style={styles.amenitiesGrid}>
//                   {getAmenities().map((amenity, index) => (
//                     <View key={index} style={styles.amenityItem}>
//                       <amenity.icon size={20} color="#FF385C" weight="duotone" />
//                       <Text style={styles.amenityText}>{amenity.name}</Text>
//                     </View>
//                   ))}
//                 </View>
//               </View>
//             )}

//             {/* Availability Calendar */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Select your date</Text>
//               <ProfessionalAvailabilityCalendar 
//                 experienceId={experienceId} 
//                 isHost={false}
//                 onDateSelect={handleDateSelect}
//                 selectedDate={selectedDate}
//               />
//             </View>

//             {/* Cancellation Policy */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Cancellation policy</Text>
//               <View style={styles.policyContainer}>
//                 <Shield size={20} color="#00A699" weight="duotone" />
//                 <Text style={styles.policyText}>
//                   {getCancellationPolicyText(e.cancellationPolicy || e.CancellationPolicy || 'moderate')}
//                 </Text>
//               </View>
//             </View>

//             {/* Reviews Section */}
//             {/* <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Reviews</Text>
//               <View style={styles.reviewSummary}>
//                 <View style={styles.ratingBreakdown}>
//                   <Text style={styles.ratingNumber}>4.8</Text>
//                   <View style={styles.ratingStars}>
//                     {[1, 2, 3, 4, 5].map((star) => (
//                       <Star key={star} size={16} color="#FF385C" weight="fill" />
//                     ))}
//                   </View>
//                   <Text style={styles.reviewCount}>24 reviews</Text>
//                 </View>
//               </View>
//             </View> */}

//             <View style={styles.bottomSpacing} />
//           </View>
//         </ScrollView>

//         {/* Fixed Booking Bar */}
//         <View style={styles.bookingBar}>
//           <View style={styles.priceInfo}>
//             <Text style={styles.finalPrice}>{formatPrice(e.pricePerPerson || e.PricePerPerson || 0)}</Text>
//             <Text style={styles.priceLabel}>per person</Text>
//           </View>
          
//           <TouchableOpacity
//             style={[styles.inviteButton, capacityLeft === 0 && styles.inviteButtonDisabled]}
//             onPress={handleInvite}
//             disabled={capacityLeft === 0}
//           >
//             <Text style={[styles.inviteText, capacityLeft === 0 && styles.inviteTextDisabled]}>
//               {isHost ? 'Edit' : (capacityLeft > 0 ? 'Invite' : 'Full')}
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={styles.reserveButton}
//             onPress={handleReserve}
//           >
//             <Text style={styles.reserveText}>
//               Reserve
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   safeArea: {
//     flex: 1,
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
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#FF5A5F',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#F0F0F0',
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerActions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   actionButton: {
//     padding: 8,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   imageContainer: {
//     position: 'relative',
//   },
//   mainImage: {
//     width: width,
//     height: 300,
//   },
//   imageIndicators: {
//     position: 'absolute',
//     bottom: 16,
//     left: 20,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   indicator: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: 'rgba(255, 255, 255, 0.5)',
//   },
//   activeIndicator: {
//     backgroundColor: '#FFFFFF',
//   },
//   content: {
//     padding: 20,
//   },
//   titleSection: {
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#222222',
//     marginBottom: 8,
//     lineHeight: 34,
//   },
//   ratingRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   rating: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#222222',
//   },
//   reviewCount: {
//     fontSize: 14,
//     color: '#717171',
//   },
//   hostSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 24,
//     paddingBottom: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F0F0F0',
//   },
//   hostAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     marginRight: 12,
//   },
//   hostInfo: {
//     flex: 1,
//   },
//   hostName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#222222',
//     marginBottom: 2,
//   },
//   hostJoined: {
//     fontSize: 14,
//     color: '#717171',
//   },
//   detailsSection: {
//     marginBottom: 24,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   detailContent: {
//     marginLeft: 12,
//     flex: 1,
//   },
//   detailLabel: {
//     fontSize: 14,
//     color: '#717171',
//     marginBottom: 2,
//   },
//   detailValue: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#222222',
//   },
//   section: {
//     marginBottom: 32,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#222222',
//     marginBottom: 16,
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: '#222222',
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
//     color: '#222222',
//   },
//   amenitiesGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 16,
//   },
//   amenityItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     backgroundColor: '#F7F7F7',
//     borderRadius: 20,
//   },
//   amenityText: {
//     fontSize: 14,
//     color: '#222222',
//     fontWeight: '500',
//   },
//   policyContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: 12,
//     padding: 16,
//     backgroundColor: '#F0FDF4',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#D1FAE5',
//   },
//   policyText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#065F46',
//     lineHeight: 20,
//   },
//   reviewSummary: {
//     padding: 20,
//     backgroundColor: '#F7F7F7',
//     borderRadius: 12,
//   },
//   ratingBreakdown: {
//     alignItems: 'center',
//   },
//   ratingNumber: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#222222',
//     marginBottom: 8,
//   },
//   ratingStars: {
//     flexDirection: 'row',
//     gap: 2,
//     marginBottom: 8,
//   },
//   bottomSpacing: {
//     height: 100,
//   },
//   bookingBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#FFFFFF',
//     borderTopWidth: 1,
//     borderTopColor: '#EBEBEB',
//   },
//   priceInfo: {
//     flex: 1,
//   },
//   finalPrice: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#222222',
//   },
//   priceLabel: {
//     fontSize: 14,
//     color: '#717171',
//   },
//   inviteButton: {
//     backgroundColor: '#00A699',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginRight: 10,
//   },
//   inviteButtonDisabled: {
//     backgroundColor: '#CDEBE3',
//   },
//   inviteText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '700',
//   },
//   inviteTextDisabled: {
//     color: '#F8F8F8',
//   },
//   reserveButton: {
//     backgroundColor: '#FF385C',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   reserveButtonDisabled: {
//     backgroundColor: '#FFB3BA',
//   },
//   reserveText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '700',
//   },
//   reserveTextDisabled: {
//     color: '#FFFFFF',
//     opacity: 0.7,
//   },
// });



import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Heart, 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Calendar,
  Shield,
  Car,
  Coffee,
  Camera,
  Check,
  Share,
  WifiHigh,
  MusicNoteIcon,
  GameControllerIcon
} from 'phosphor-react-native';
import { useExperienceDetails } from '../hooks/queries/useExperienceDetails';
import { useExperienceParticipants } from '../hooks/queries/useExperienceInvites';
import { useUser } from '../hooks/useUser';
import { ProfessionalAvailabilityCalendar } from '../components/ProfessionalAvailabilityCalendar';

const { width } = Dimensions.get('window');

// Airbnb Color System
const COLORS = {
  primary: '#FF385C',      // Airbnb red
  text: '#222222',         // Primary text
  textLight: '#717171',    // Secondary text
  border: '#DDDDDD',       // Borders
  background: '#FFFFFF',   // White background
  backgroundGray: '#F7F7F7', // Light gray
  success: '#00A699',      // Success green
  black: '#000000',
};

export const ProfessionalExperienceDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { experienceId } = route.params as { experienceId: number };
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const { data: experience, isLoading } = useExperienceDetails(experienceId);
  const { data: participants = [] } = useExperienceParticipants(experienceId);
  const { user } = useUser();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!experience) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Experience not found</Text>
        </View>
      </View>
    );
  }

  const e = experience;
  const capacityLeft = (e.capacity || e.Capacity || 0) - participants.length;
  const isHost = user?.ID === e.hostID || user?.ID === e.HostID;

  const formatPrice = (price: number) => `$${price}`;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${mins} minutes`;
  };

  const getCancellationPolicyText = (policy: string) => {
    switch (policy?.toLowerCase()) {
      case 'flexible':
        return 'Free cancellation up to 24 hours before the experience starts';
      case 'moderate':
        return 'Free cancellation up to 5 days before the experience starts';
      case 'strict':
        return 'Cancel up to 7 days before for a 50% refund';
      default:
        return 'Cancellation policy available upon request';
    }
  };

  const getAmenities = () => {
    const amenities = [];
    if (e.wifi || e.Wifi) amenities.push({ icon: WifiHigh, name: 'WiFi available' });
    if (e.parking || e.Parking) amenities.push({ icon: Car, name: 'Parking included' });
    if (e.food || e.Food) amenities.push({ icon: Coffee, name: 'Food & drinks' });
    if (e.photography || e.Photography) amenities.push({ icon: Camera, name: 'Photography' });
    if (e.music || e.Music) amenities.push({ icon: MusicNoteIcon, name: 'Music' });
    if (e.games || e.Games) amenities.push({ icon: GameControllerIcon, name: 'Activities' });
    return amenities;
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleInvite = () => {
    if (isHost) {
      (navigation as any).navigate('ExperienceEdit', { experienceId });
    } else {
      (navigation as any).navigate('GroupOnboarding', { experienceId, capacityLeft });
    }
  };

  const handleReserve = () => {
    const dateToUse = selectedDate || new Date().toISOString().split('T')[0];
    (navigation as any).navigate('ExperienceBookingConfirmation', {
      experienceId,
      selectedDate: dateToUse,
      selectedTime: '',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
            <ArrowLeft size={18} color={COLORS.text} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsLiked(!isLiked)}
            activeOpacity={0.7}
          >
            <Heart 
              size={18} 
              color={isLiked ? COLORS.primary : COLORS.text}
              weight={isLiked ? "fill" : "duotone"}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <Share size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image */}
        <Image
          source={{ uri: e.imageURL || e.ImageURL || 'https://via.placeholder.com/400x300' }}
          style={styles.mainImage}
          resizeMode="cover"
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Rating */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{e.title || e.Title || 'Experience'}</Text>
            <View style={styles.ratingRow}>
              <Star size={14} color={COLORS.text} weight="fill" />
              <Text style={styles.ratingText}>
                {(e.rating || e.Rating || 4.8).toFixed(1)}
              </Text>
              <Text style={styles.dotSeparator}>·</Text>
              <Text style={styles.reviewText}>
                {e.reviewCount || e.ReviewCount || 24} reviews
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Host */}
          <View style={styles.hostSection}>
            <Image
              source={{ uri: e.host?.avatarURL || 'https://i.pravatar.cc/100' }}
              style={styles.hostAvatar}
            />
            <View>
              <Text style={styles.hostName}>
                Hosted by {e.host?.firstName || 'John'}
              </Text>
              <Text style={styles.hostMeta}>
                Joined in {new Date().getFullYear()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Key Details */}
          <View style={styles.detailsSection}>
            <DetailRow 
              icon={Clock} 
              label="Duration" 
              value={formatDuration(e.duration || e.Duration || 120)} 
            />
            <DetailRow 
              icon={Users} 
              label="Group size" 
              value={`Up to ${e.capacity || e.Capacity || 10} guests`} 
            />
            <DetailRow 
              icon={MapPin} 
              label="Location" 
              value={e.location || e.Location || 'Mauritania'} 
            />
            <DetailRow 
              icon={Calendar} 
              label="Available" 
              value={`${(e.startTime || e.StartTime) || '9:00 AM'} - ${(e.endTime || e.EndTime) || '5:00 PM'}`} 
            />
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What you'll do</Text>
            <Text style={styles.bodyText}>
              {e.description || e.Description || 'Join us for an amazing experience that will create lasting memories. This unique adventure combines local culture, beautiful scenery, and unforgettable moments.'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* What's Included */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's included</Text>
            <IncludedItem text="All necessary equipment" />
            <IncludedItem text="Professional guide" />
            <IncludedItem text="Refreshments and snacks" />
            <IncludedItem text="Transportation if needed" />
          </View>

          {/* Amenities */}
          {getAmenities().length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What's provided</Text>
                <View style={styles.amenitiesList}>
                  {getAmenities().map((amenity, index) => (
                    <View key={index} style={styles.amenityRow}>
                      <amenity.icon size={20} color={COLORS.text} />
                      <Text style={styles.amenityText}>{amenity.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={styles.divider} />

          {/* Calendar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select a date</Text>
            <ProfessionalAvailabilityCalendar 
              experienceId={experienceId} 
              isHost={false}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          </View>

          <View style={styles.divider} />

          {/* Cancellation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation policy</Text>
            <View style={styles.policyRow}>
              <Shield size={20} color={COLORS.text} />
              <Text style={styles.bodyText}>
                {getCancellationPolicyText(e.cancellationPolicy || e.CancellationPolicy || 'moderate')}
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>
            <Text style={styles.priceAmount}>
              {formatPrice(e.pricePerPerson || e.PricePerPerson || 0)}
            </Text>
            <Text style={styles.priceUnit}> / person</Text>
          </Text>
        </View>
        
        <View style={styles.buttonGroup}>
          {!isHost && (
            <TouchableOpacity
              style={[styles.secondaryButton, capacityLeft === 0 && styles.buttonDisabled]}
              onPress={handleInvite}
              disabled={capacityLeft === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>
                {capacityLeft > 0 ? 'Invite' : 'Full'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleReserve}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>
              {isHost ? 'Manage' : 'Reserve'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Helper Components
const DetailRow = ({ icon: Icon, label, value }: any) => (
  <View style={styles.detailRow}>
    <Icon size={20} color={COLORS.text} />
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const IncludedItem = ({ text }: { text: string }) => (
  <View style={styles.includedRow}>
    <Check size={16} color={COLORS.text} />
    <Text style={styles.includedText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  mainImage: {
    width: width,
    height: 280,
    backgroundColor: COLORS.backgroundGray,
  },
  content: {
    paddingHorizontal: 24,
  },
  titleSection: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 32,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  dotSeparator: {
    fontSize: 15,
    color: COLORS.textLight,
    marginHorizontal: 6,
  },
  reviewText: {
    fontSize: 15,
    color: COLORS.text,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: COLORS.backgroundGray,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  hostMeta: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  detailsSection: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text,
    flex: 1,
  },
  includedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  includedText: {
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 12,
  },
  amenitiesList: {
    gap: 16,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 12,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bottomSpacing: {
    height: 120,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontSize: 16,
  },
  priceAmount: {
    fontWeight: '600',
    color: COLORS.text,
  },
  priceUnit: {
    fontWeight: '400',
    color: COLORS.textLight,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.text,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#000",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});