import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Switch,
  Modal
} from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import {
  CreateExperienceInput,
  ACTIVITY_LEVELS,
  DIFFICULTY_LEVELS,
  CANCELLATION_POLICIES
} from "../../types/experience";
import { useUser } from "../../hooks/useUser";
import { useUserQuery } from "../../hooks/queries/useUserQuery";
import { useHostProfile } from "../../hooks/useHostProfile";
import { pickImageNative, pickVideoNative } from "../../utils/nativePhotoPicker";
import axios from "axios";
import { cloudinary, experienceEndpoints } from "../../constants";

interface StepProps {
  experienceData: Partial<CreateExperienceInput>;
  updateExperienceData: (data: Partial<CreateExperienceInput>) => void;
  onNext: () => void;
  onPrevious: () => void;
  user: any;
  navigation?: any;
}

const PlaceholderStep: React.FC<
  StepProps & { title: string; description: string }
> = ({ title, description, onNext, onPrevious }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDescription}>{description}</Text>

          <View style={styles.placeholderContainer}>
            <MaterialCommunityIcons
              name="hammer-wrench"
              size={48}
              color="#8E8E93"
            />
            <Text style={styles.placeholderText}>
              This step is coming soon!
            </Text>
            <Text style={styles.placeholderSubtext}>
              We're building this feature to provide you with the best
              experience creation flow.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={onNext}
        >
          <Text style={styles.nextButtonText}>Skip for now</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const WhatWeDoStep: React.FC<StepProps> = (props) => (
  <WhatWeDoReal {...props} />
);

export const DurationStep: React.FC<StepProps> = (props) => (
  <DurationReal {...props} />
);

export const HostProfileStep: React.FC<StepProps> = (props) => (
  <HostProfileReal {...props} />
);

export const WhatToBringStep: React.FC<StepProps> = (props) => (
  <WhatToBringReal {...props} />
);

export const WhoCanAttendStep: React.FC<StepProps> = (props) => (
  <WhoCanAttendReal {...props} />
);

export const ActivityLevelStep: React.FC<StepProps> = (props) => (
  <ActivityLevelReal {...props} />
);

export const DifficultyLevelStep: React.FC<StepProps> = (props) => (
  <DifficultyLevelReal {...props} />
);

export const ExperienceNameStep: React.FC<StepProps> = (props) => (
  <ExperienceNameReal {...props} />
);

export const PhotosStep: React.FC<StepProps> = (props) => (
  <PhotosReal {...props} />
);

export const GroupSizeTimingStep: React.FC<StepProps> = (props) => (
  <GroupSizeTimingReal {...props} />
);

export const PricingStep: React.FC<StepProps> = (props) => (
  <PricingReal {...props} />
);

export const GroupDiscountsStep: React.FC<StepProps> = (props) => (
  <GroupDiscountsReal {...props} />
);

export const ArrivalTimeStep: React.FC<StepProps> = (props) => (
  <ArrivalTimeReal {...props} />
);

export const CancellationPolicyStep: React.FC<StepProps> = (props) => (
  <CancellationPolicyReal {...props} />
);

export const VideoDemoStep: React.FC<StepProps> = (props) => (
  <VideoDemoReal {...props} />
);

export const IdentityVerificationStep: React.FC<StepProps> = (props) => (
  <IdentityVerificationReal {...props} />
);

export const ReviewSubmitStep: React.FC<StepProps> = (props) => (
  <ReviewSubmitReal {...props} />
);

// Clean Success Modal Styles
const modalOverlay = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center" as const,
  alignItems: "center" as const
};

const modalContainer = {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  margin: 20,
  padding: 24,
  width: "90%",
  maxWidth: 400,
  alignItems: "center" as const,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 8
};

const iconContainer = {
  marginBottom: 16
};

const modalTitle = {
  fontSize: 24,
  fontWeight: "700",
  color: "#222222",
  textAlign: "center" as const,
  marginBottom: 8
};

const modalSubtitle = {
  fontSize: 16,
  color: "#717171",
  textAlign: "center" as const,
  lineHeight: 22,
  marginBottom: 24
};

const experienceInfo = {
  backgroundColor: "#F7F7F7",
  borderRadius: 12,
  padding: 16,
  width: "100%",
  marginBottom: 24,
  alignItems: "center" as const
};

const experienceTitle = {
  fontSize: 18,
  fontWeight: "600",
  color: "#222222",
  textAlign: "center" as const,
  marginBottom: 4
};

const experienceLocation = {
  fontSize: 14,
  color: "#717171",
  textAlign: "center" as const,
  marginBottom: 4
};

const experiencePrice = {
  fontSize: 16,
  fontWeight: "600",
  color: "#00A699",
  textAlign: "center" as const
};

const modalButton = {
  backgroundColor: "#00A699",
  paddingVertical: 16,
  paddingHorizontal: 32,
  borderRadius: 12,
  width: "100%",
  alignItems: "center" as const
};

const modalButtonText = {
  fontSize: 16,
  fontWeight: "600",
  color: "#FFFFFF"
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1,
    paddingVertical: 20
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8
  },
  sectionDescription: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 20,
    lineHeight: 22
  },
  placeholderContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA"
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 16,
    marginBottom: 8
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA"
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  previousButton: {
    backgroundColor: "#F8F9FA"
  },
  previousButtonText: {
    fontSize: 16,
    color: "#8E8E93",
    marginLeft: 8
  },
  nextButton: {
    backgroundColor: "#FF385C"
  },
  nextButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    marginRight: 8
  }
});

// Host profile real implementation (Step 7)
const HostProfileReal: React.FC<StepProps> = ({ onNext, onPrevious }) => {
  // Pull latest data from existing profile sources
  const { user } = useUser();
  const { data: fullUser } = useUserQuery();
  const { profile } = useHostProfile();

  const email = fullUser?.email || user?.email || "";
  const firstName =
    fullUser?.firstName ||
    user?.firstName ||
    (email ? email.split("@")[0] : "");
  const lastName = fullUser?.lastName || user?.lastName || "";
  const avatarURL =
    fullUser?.avatarURL || profile?.avatarURL || (user as any)?.avatarURL || "";
  const bioFromProfile = fullUser?.bio || profile?.bio || "";
  const languages: string[] = Array.isArray(fullUser?.languages)
    ? fullUser?.languages
    : typeof fullUser?.languages === "string"
    ? (() => {
        try {
          return JSON.parse(fullUser!.languages);
        } catch {
          return [];
        }
      })()
    : profile?.languages || [];

  console.log("USER PROFILE", profile);

  const [showLastName, setShowLastName] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);
  const [shortBio, setShortBio] = useState(bioFromProfile);

  const canNext = !!firstName;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Show your profile to guests</Text>
          <Text style={styles.sectionDescription}>
            This helps guests trust who they'll meet. We’ll display your
            verified name, avatar and basic info.
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16
            }}
          >
            <Image
              source={{ uri: showAvatar ? avatarURL : "" }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#EEE",
                marginRight: 12
              }}
            />
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700" }}>
                {firstName}{" "}
                {showLastName ? lastName : lastName ? lastName[0] + "." : ""}
              </Text>
              <Text style={{ color: "#8E8E93" }}>
                {languages && languages.length
                  ? languages.join(" • ")
                  : "No languages set"}
              </Text>
            </View>
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E5EA",
              borderRadius: 12,
              padding: 12,
              backgroundColor: "#F8F9FA",
              marginBottom: 16
            }}
          >
            <Text style={{ fontSize: 14, color: "#8E8E93", marginBottom: 8 }}>
              Short bio (optional)
            </Text>
            <TextInput
              value={shortBio}
              onChangeText={setShortBio}
              placeholder="Tell guests a bit about you (max 140 chars)"
              placeholderTextColor="#8E8E93"
              style={{ fontSize: 16, color: "#000" }}
              maxLength={140}
            />
            <Text
              style={{ textAlign: "right", color: "#8E8E93", marginTop: 6 }}
            >
              {shortBio.length}/140
            </Text>
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E5EA",
              borderRadius: 12,
              padding: 12,
              backgroundColor: "#F8F9FA"
            }}
          >
            <RowToggle
              label="Show last name"
              value={showLastName}
              onChange={setShowLastName}
            />
            <RowToggle
              label="Show profile photo"
              value={showAvatar}
              onChange={setShowAvatar}
            />
          </View>
        </View>
      </View>

      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !canNext && { backgroundColor: "#F2F2F7" }
          ]}
          disabled={!canNext}
          onPress={onNext}
        >
          <Text
            style={[styles.nextButtonText, !canNext && { color: "#C7C7CC" }]}
          >
            Next
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={canNext ? "#FFF" : "#C7C7CC"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const RowToggle = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8
    }}
  >
    <Text style={{ fontSize: 16, color: "#000" }}>{label}</Text>
    <Switch value={value} onValueChange={onChange} />
  </View>
);

// Step 8: What to bring
const WhatToBringReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [required, setRequired] = useState<boolean>(
    experienceData.BringRequired ?? false
  );
  const [items, setItems] = useState<string>(experienceData.WhatToBring || "");
  const canNext = !required || items.trim().length >= 5;
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Do guests need to bring anything?
          </Text>
          <Text style={styles.sectionDescription}>
            If yes, list items clearly (e.g., comfortable shoes, water, ID).
          </Text>

          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E5EA",
              borderRadius: 12,
              padding: 12,
              backgroundColor: "#F8F9FA",
              marginBottom: 16
            }}
          >
            <RowToggle
              label="Guests must bring items"
              value={required}
              onChange={setRequired}
            />
          </View>

          {required && (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E5EA",
                borderRadius: 12,
                padding: 12,
                backgroundColor: "#F8F9FA"
              }}
            >
              <TextInput
                value={items}
                onChangeText={setItems}
                placeholder="List required items, separated by commas"
                placeholderTextColor="#8E8E93"
                style={{
                  fontSize: 16,
                  color: "#000",
                  minHeight: 80,
                  textAlignVertical: "top"
                }}
                multiline
              />
            </View>
          )}
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !canNext && { backgroundColor: "#F2F2F7" }
          ]}
          disabled={!canNext}
          onPress={() => {
            updateExperienceData({
              BringRequired: required,
              WhatToBring: items.trim()
            });
            onNext();
          }}
        >
          <Text
            style={[styles.nextButtonText, !canNext && { color: "#C7C7CC" }]}
          >
            Next
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={canNext ? "#FFF" : "#C7C7CC"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Step 9: Who can attend (age)
const WhoCanAttendReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [minAge, setMinAge] = useState(experienceData.MinAge || 0);
  const [maxAge, setMaxAge] = useState(experienceData.MaxAge || 0);
  const valid = maxAge === 0 || maxAge >= minAge;
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who can attend?</Text>
          <Text style={styles.sectionDescription}>
            Set age limits (leave max empty for no upper limit).
          </Text>
          <View style={{ flexDirection: "row" }}>
            <NumberField
              label="Min age"
              value={minAge}
              setValue={setMinAge}
              min={0}
              max={99}
            />
            <View style={{ width: 12 }} />
            <NumberField
              label="Max age"
              value={maxAge}
              setValue={setMaxAge}
              min={0}
              max={99}
            />
          </View>
          {!valid && (
            <Text style={{ color: "#FF5A5F", marginTop: 8 }}>
              Max age must be greater than or equal to min age.
            </Text>
          )}
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !valid && { backgroundColor: "#F2F2F7" }
          ]}
          disabled={!valid}
          onPress={() => {
            updateExperienceData({ MinAge: minAge, MaxAge: maxAge });
            onNext();
          }}
        >
          <Text style={[styles.nextButtonText, !valid && { color: "#C7C7CC" }]}>
            Next
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={valid ? "#FFF" : "#C7C7CC"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Step 10: Activity level
const ActivityLevelReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [level, setLevel] = useState(experienceData.ActivityLevel || "light");
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity level</Text>
          <Text style={styles.sectionDescription}>
            Choose the expected physical intensity.
          </Text>
          {ACTIVITY_LEVELS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setLevel(opt.value)}
              style={{
                padding: 12,
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: level === opt.value ? "#FF385C" : "#E5E5EA",
                backgroundColor: level === opt.value ? "#FFF5F5" : "#F8F9FA"
              }}
            >
              <Text style={{ fontWeight: "600", color: "#000" }}>
                {opt.label}
              </Text>
              <Text style={{ color: "#8E8E93" }}>{opt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={() => {
            updateExperienceData({ ActivityLevel: level });
            onNext();
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Step 11: Difficulty level
const DifficultyLevelReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [level, setLevel] = useState(
    experienceData.DifficultyLevel || "beginner"
  );
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required experience level</Text>
          <Text style={styles.sectionDescription}>
            Select the skill level suitable for participants.
          </Text>
          {DIFFICULTY_LEVELS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setLevel(opt.value)}
              style={{
                padding: 12,
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: level === opt.value ? "#FF385C" : "#E5E5EA",
                backgroundColor: level === opt.value ? "#FFF5F5" : "#F8F9FA"
              }}
            >
              <Text style={{ fontWeight: "600", color: "#000" }}>
                {opt.label}
              </Text>
              <Text style={{ color: "#8E8E93" }}>{opt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={() => {
            updateExperienceData({ DifficultyLevel: level });
            onNext();
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Real implementations

const ExperienceNameReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [title, setTitle] = useState(experienceData.Title || "");
  const canNext = title.trim().length >= 6;
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Give your experience a name</Text>
          <Text style={styles.sectionDescription}>
            Make it specific, appealing, and 6–60 characters.
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E5EA",
              borderRadius: 12,
              padding: 12,
              backgroundColor: "#F8F9FA"
            }}
          >
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Sunset camel trek across Nouakchott dunes"
              placeholderTextColor="#8E8E93"
              style={{ fontSize: 16, color: "#000" }}
              maxLength={60}
            />
            <Text
              style={{ textAlign: "right", color: "#8E8E93", marginTop: 6 }}
            >
              {title.length}/60
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !canNext && { backgroundColor: "#F2F2F7" }
          ]}
          disabled={!canNext}
          onPress={() => {
            updateExperienceData({ Title: title.trim() });
            onNext();
          }}
        >
          <Text
            style={[styles.nextButtonText, !canNext && { color: "#C7C7CC" }]}
          >
            Next
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={canNext ? "#FFF" : "#C7C7CC"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const WhatWeDoReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [plan, setPlan] = useState(experienceData.WhatWeDo || "");
  const canNext = plan.trim().length >= 50;
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            What will you and your guests do?
          </Text>
          <Text style={styles.sectionDescription}>
            Outline the flow from start to finish. Mention meeting point,
            activities, breaks, and wrap‑up.
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E5EA",
              borderRadius: 12,
              padding: 12,
              backgroundColor: "#F8F9FA"
            }}
          >
            <TextInput
              value={plan}
              onChangeText={setPlan}
              placeholder="1) Meet at … 2) Safety briefing … 3) Camel trek … 4) Tea ceremony … 5) Return …"
              placeholderTextColor="#8E8E93"
              style={{
                fontSize: 16,
                color: "#000",
                minHeight: 140,
                textAlignVertical: "top"
              }}
              multiline
              maxLength={1500}
            />
            <Text
              style={{ textAlign: "right", color: "#8E8E93", marginTop: 6 }}
            >
              {plan.length}/1500
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !canNext && { backgroundColor: "#F2F2F7" }
          ]}
          disabled={!canNext}
          onPress={() => {
            updateExperienceData({ WhatWeDo: plan.trim() });
            onNext();
          }}
        >
          <Text
            style={[styles.nextButtonText, !canNext && { color: "#C7C7CC" }]}
          >
            Next
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={canNext ? "#FFF" : "#C7C7CC"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DurationReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [hours, setHours] = useState(
    Math.floor((experienceData.Duration || 60) / 60)
  );
  const [minutes, setMinutes] = useState((experienceData.Duration || 60) % 60);
  const total = hours * 60 + minutes;
  const canNext = total >= 30;
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How long is your experience?</Text>
          <Text style={styles.sectionDescription}>
            Minimum 30 minutes. Use hours and minutes.
          </Text>
          <View style={{ flexDirection: "row" }}>
            <NumberField
              label="Hours"
              value={hours}
              setValue={setHours}
              min={0}
              max={12}
              unit="h"
            />
            <View style={{ width: 12 }} />
            <NumberField
              label="Minutes"
              value={minutes}
              setValue={setMinutes}
              min={0}
              max={55}
              step={5}
              unit="m"
            />
          </View>
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !canNext && { backgroundColor: "#F2F2F7" }
          ]}
          disabled={!canNext}
          onPress={() => {
            updateExperienceData({ Duration: total });
            onNext();
          }}
        >
          <Text
            style={[styles.nextButtonText, !canNext && { color: "#C7C7CC" }]}
          >
            Next
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={canNext ? "#FFF" : "#C7C7CC"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const NumberField = ({
  label,
  value,
  setValue,
  min = 0,
  max = 100,
  step = 1,
  unit = ""
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) => (
  <View
    style={{
      flex: 1,
      borderWidth: 1,
      borderColor: "#E5E5EA",
      borderRadius: 16,
      padding: 16,
      backgroundColor: "#F8F9FA",
      alignItems: "center"
    }}
  >
    <Text
      style={{
        fontSize: 14,
        color: "#8E8E93",
        marginBottom: 12,
        fontWeight: "500"
      }}
    >
      {label}
    </Text>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <TouchableOpacity
        onPress={() => setValue(Math.max(min, value - step))}
        style={{
          padding: 12,
          backgroundColor: value > min ? "#FF385C" : "#F2F2F7",
          borderRadius: 20,
          opacity: value > min ? 1 : 0.5
        }}
        disabled={value <= min}
      >
        <MaterialCommunityIcons
          name="minus"
          size={20}
          color={value > min ? "#FFF" : "#8E8E93"}
        />
      </TouchableOpacity>

      <View
        style={{
          minWidth: 60,
          alignItems: "center",
          marginHorizontal: 16
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#000" }}>
          {value}
          {unit}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setValue(Math.min(max, value + step))}
        style={{
          padding: 12,
          backgroundColor: value < max ? "#FF385C" : "#F2F2F7",
          borderRadius: 20,
          opacity: value < max ? 1 : 0.5
        }}
        disabled={value >= max}
      >
        <MaterialCommunityIcons
          name="plus"
          size={20}
          color={value < max ? "#FFF" : "#8E8E93"}
        />
      </TouchableOpacity>
    </View>

    {/* Range indicator */}
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 8
      }}
    >
      <Text style={{ fontSize: 12, color: "#8E8E93" }}>
        {min}
        {unit}
      </Text>
      <Text style={{ fontSize: 12, color: "#8E8E93" }}>
        {max}
        {unit}
      </Text>
    </View>
  </View>
);

const PhotosReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [photos, setPhotos] = useState<
    Array<{ url: string; caption: string; order: number }>
  >(
    Array.isArray((experienceData as any).photos)
      ? (experienceData as any).photos.map((p: any, i: number) => ({
          url: typeof p === "string" ? p : p.url || p,
          caption: p.caption || "",
          order: i + 1
        }))
      : []
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: number]: number;
  }>({});
  const [editingCaption, setEditingCaption] = useState<number | null>(null);
  const [tempCaption, setTempCaption] = useState("");

  const pickPhoto = async () => {
    // Use native picker - no permissions needed
    const res = await pickImageNative({
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 3]
    });

    if (res.canceled || !res.assets || res.assets.length === 0) return;

    const asset = res.assets[0];
    const photoIndex = photos.length;
    setUploading(true);
    setUploadProgress((prev) => ({ ...prev, [photoIndex]: 0 }));

    const data = new FormData();
    data.append("file", {
      uri: asset.uri,
      name: "photo.jpg",
      type: "image/jpeg"
    } as any);
    data.append("upload_preset", cloudinary.uploadPreset);

    try {
      const upload = await axios.post(cloudinary.uploadUrl("image"), data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress((prev) => ({ ...prev, [photoIndex]: progress }));
        }
      });

      const url = upload.data.secure_url as string;
      const newPhoto = {
        url,
        caption: "",
        order: photos.length + 1
      };

      setPhotos((prev) => [...prev, newPhoto]);
      Alert.alert("Success", "Photo uploaded successfully!");
    } catch (e) {
      Alert.alert("Upload failed", "Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[photoIndex];
        return newProgress;
      });
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert("Remove Photo", "Are you sure you want to remove this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const newPhotos = photos
            .filter((_, i) => i !== index)
            .map((photo, i) => ({
              ...photo,
              order: i + 1
            }));
          setPhotos(newPhotos);
        }
      }
    ]);
  };

  const startEditingCaption = (index: number) => {
    setEditingCaption(index);
    setTempCaption(photos[index].caption);
  };

  const saveCaption = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index].caption = tempCaption;
    setPhotos(newPhotos);
    setEditingCaption(null);
    setTempCaption("");
  };

  const cancelEditingCaption = () => {
    setEditingCaption(null);
    setTempCaption("");
  };

  const canNext = photos.length >= 5;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add photos to your experience</Text>
          <Text style={styles.sectionDescription}>
            Upload at least 5 high-quality photos that showcase your experience.
            Great photos help guests understand what to expect.
          </Text>

          {/* Photo Tips */}
          <View
            style={{
              backgroundColor: "#E3F2FD",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#BBDEFB"
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8
              }}
            >
              <MaterialCommunityIcons
                name="lightbulb"
                size={20}
                color="#1976D2"
              />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1976D2"
                }}
              >
                Photo Tips
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#1976D2", lineHeight: 20 }}>
              • Use natural lighting when possible{"\n"}• Show the main
              activities and locations{"\n"}• Include photos of you as the host
              {"\n"}• Avoid blurry or dark images
            </Text>
          </View>

          {/* Photos Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between"
            }}
          >
            {photos.map((photo, index) => (
              <View
                key={index}
                style={{
                  width: "48%",
                  marginBottom: 16,
                  backgroundColor: "#F8F9FA",
                  borderRadius: 12,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#E5E5EA"
                }}
              >
                <View style={{ position: "relative" }}>
                  <Image
                    source={{ uri: photo.url }}
                    style={{
                      width: "100%",
                      aspectRatio: 4 / 3,
                      backgroundColor: "#EEE"
                    }}
                  />

                  {/* Upload Progress */}
                  {uploadProgress[index] !== undefined && (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.7)",
                        justifyContent: "center",
                        alignItems: "center"
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFF",
                          fontSize: 16,
                          fontWeight: "600"
                        }}
                      >
                        {uploadProgress[index]}%
                      </Text>
                    </View>
                  )}

                  {/* Remove Button */}
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      borderRadius: 16,
                      padding: 4
                    }}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={16}
                      color="#FFF"
                    />
                  </TouchableOpacity>

                  {/* Photo Number */}
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4
                    }}
                  >
                    <Text
                      style={{ color: "#FFF", fontSize: 12, fontWeight: "600" }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                </View>

                {/* Caption Section */}
                <View style={{ padding: 12 }}>
                  {editingCaption === index ? (
                    <View>
                      <TextInput
                        value={tempCaption}
                        onChangeText={setTempCaption}
                        placeholder="Add a caption (optional)"
                        placeholderTextColor="#8E8E93"
                        style={{
                          fontSize: 14,
                          color: "#000",
                          borderWidth: 1,
                          borderColor: "#E5E5EA",
                          borderRadius: 8,
                          padding: 8,
                          backgroundColor: "#FFF"
                        }}
                        multiline
                        maxLength={100}
                      />
                      <View style={{ flexDirection: "row", marginTop: 8 }}>
                        <TouchableOpacity
                          onPress={() => saveCaption(index)}
                          style={{
                            flex: 1,
                            backgroundColor: "#FF385C",
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            marginRight: 4,
                            alignItems: "center"
                          }}
                        >
                          <Text
                            style={{
                              color: "#FFF",
                              fontSize: 12,
                              fontWeight: "600"
                            }}
                          >
                            Save
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={cancelEditingCaption}
                          style={{
                            flex: 1,
                            backgroundColor: "#F2F2F7",
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            marginLeft: 4,
                            alignItems: "center"
                          }}
                        >
                          <Text
                            style={{
                              color: "#8E8E93",
                              fontSize: 12,
                              fontWeight: "600"
                            }}
                          >
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => startEditingCaption(index)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: photo.caption ? "#000" : "#8E8E93",
                          flex: 1,
                          marginRight: 8
                        }}
                      >
                        {photo.caption || "Add a caption"}
                      </Text>
                      <MaterialCommunityIcons
                        name="pencil"
                        size={16}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Add Photo Button */}
            <TouchableOpacity
              onPress={pickPhoto}
              disabled={uploading}
              style={{
                width: "48%",
                aspectRatio: 4 / 3,
                backgroundColor: uploading ? "#F2F2F7" : "#F8F9FA",
                borderWidth: 2,
                borderColor: uploading ? "#C7C7CC" : "#E5E5EA",
                borderStyle: "dashed",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16
              }}
            >
              {uploading ? (
                <View style={{ alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="upload"
                    size={32}
                    color="#8E8E93"
                  />
                  <Text
                    style={{
                      color: "#8E8E93",
                      fontSize: 14,
                      marginTop: 8,
                      textAlign: "center"
                    }}
                  >
                    Uploading...
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="camera-plus"
                    size={32}
                    color="#8E8E93"
                  />
                  <Text
                    style={{
                      color: "#8E8E93",
                      fontSize: 14,
                      marginTop: 8,
                      textAlign: "center"
                    }}
                  >
                    Add Photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View
            style={{
              backgroundColor: canNext ? "#F0FFF4" : "#FFF8F0",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: canNext ? "#C6F6D5" : "#FED7AA"
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8
              }}
            >
              <MaterialCommunityIcons
                name={canNext ? "check-circle" : "clock"}
                size={20}
                color={canNext ? "#00C851" : "#FF9500"}
              />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 16,
                  fontWeight: "600",
                  color: canNext ? "#00C851" : "#FF9500"
                }}
              >
                {canNext ? "Photos Complete" : "Photos Required"}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                color: canNext ? "#2D5A27" : "#B8860B",
                lineHeight: 20
              }}
            >
              {canNext
                ? `Great! You've uploaded ${photos.length} photos.`
                : `Add ${Math.max(0, 5 - photos.length)} more photo${
                    Math.max(0, 5 - photos.length) === 1 ? "" : "s"
                  } to continue.`}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !canNext && { backgroundColor: "#F2F2F7" }
          ]}
          disabled={!canNext}
          onPress={() => {
            updateExperienceData({ ...(experienceData as any), photos });
            onNext();
          }}
        >
          <Text
            style={[styles.nextButtonText, !canNext && { color: "#C7C7CC" }]}
          >
            Next
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={canNext ? "#FFF" : "#C7C7CC"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PricingReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [price, setPrice] = useState(experienceData.PricePerPerson || 50);
  const canNext = price >= 50;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set your price per person</Text>
          <Text style={styles.sectionDescription}>
            Choose a fair price that reflects the value of your experience.
            Recommended minimum 50 MRU per person.
          </Text>

          <View style={{ marginBottom: 20 }}>
            <NumberField
              label="Price per person"
              value={price}
              setValue={setPrice}
              min={50}
              max={5000}
              step={50}
              unit=" MRU"
            />
          </View>

          {/* Price guidance */}
          <View
            style={{
              backgroundColor: "#E3F2FD",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#BBDEFB"
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8
              }}
            >
              <MaterialCommunityIcons
                name="information"
                size={20}
                color="#1976D2"
              />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1976D2"
                }}
              >
                Pricing Tips
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#1976D2", lineHeight: 20 }}>
              • Consider your costs (materials, transportation, time){"\n"}•
              Research similar experiences in your area{"\n"}• Start with a
              competitive price to build reviews{"\n"}• You can adjust pricing
              later based on demand
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !canNext && { backgroundColor: "#F2F2F7" }
          ]}
          disabled={!canNext}
          onPress={() => {
            updateExperienceData({ PricePerPerson: price });
            onNext();
          }}
        >
          <Text
            style={[styles.nextButtonText, !canNext && { color: "#C7C7CC" }]}
          >
            Next
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={canNext ? "#FFF" : "#C7C7CC"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Step 14: Group size & timing
const GroupSizeTimingReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [groupSize, setGroupSize] = useState(experienceData.GroupSize || 4);
  const [startTime, setStartTime] = useState(
    experienceData.StartTime || "09:00"
  );
  const [endTime, setEndTime] = useState(experienceData.EndTime || "12:00");
  const canNext =
    groupSize > 0 &&
    /^\d{2}:\d{2}$/.test(startTime) &&
    /^\d{2}:\d{2}$/.test(endTime);
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group size and timing</Text>
          <Text style={styles.sectionDescription}>
            Set your maximum group size and start/end times.
          </Text>
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            <NumberField
              label="Maximum group size"
              value={groupSize}
              setValue={setGroupSize}
              min={1}
              max={30}
              unit=" people"
            />
          </View>
          <View style={{ flexDirection: "row" }}>
            <TimeField
              label="Start time"
              value={startTime}
              setValue={setStartTime}
            />
            <View style={{ width: 12 }} />
            <TimeField label="End time" value={endTime} setValue={setEndTime} />
          </View>
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !canNext && { backgroundColor: "#F2F2F7" }
          ]}
          disabled={!canNext}
          onPress={() => {
            updateExperienceData({
              GroupSize: groupSize,
              StartTime: startTime,
              EndTime: endTime
            });
            onNext();
          }}
        >
          <Text
            style={[styles.nextButtonText, !canNext && { color: "#C7C7CC" }]}
          >
            Next
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={canNext ? "#FFF" : "#C7C7CC"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TimeField = ({
  label,
  value,
  setValue
}: {
  label: string;
  value: string;
  setValue: (s: string) => void;
}) => (
  <View
    style={{
      flex: 1,
      borderWidth: 1,
      borderColor: "#E5E5EA",
      borderRadius: 12,
      padding: 12,
      backgroundColor: "#F8F9FA"
    }}
  >
    <Text style={{ fontSize: 14, color: "#8E8E93", marginBottom: 8 }}>
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={setValue}
      placeholder="HH:MM"
      keyboardType="numeric"
      style={{ fontSize: 16, color: "#000" }}
      maxLength={5}
    />
  </View>
);

// Step 16: Group discounts
const GroupDiscountsReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [discounts, setDiscounts] = useState<
    Array<{ min: number; max: number; percent: number }>
  >([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMin, setNewMin] = useState(4);
  const [newMax, setNewMax] = useState(6);
  const [newPercent, setNewPercent] = useState(10);

  const addDiscount = () => {
    if (newMin > 0 && newMax >= newMin && newPercent > 0 && newPercent <= 50) {
      setDiscounts([
        ...discounts,
        { min: newMin, max: newMax, percent: newPercent }
      ]);
      setShowAddForm(false);
      setNewMin(4);
      setNewMax(6);
      setNewPercent(10);
    }
  };

  const removeDiscount = (index: number) => {
    setDiscounts(discounts.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group discounts (optional)</Text>
          <Text style={styles.sectionDescription}>
            Offer discounts for larger groups to encourage bookings.
          </Text>

          {discounts.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 12,
                  color: "#000"
                }}
              >
                Current discounts:
              </Text>
              {discounts.map((discount, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    backgroundColor: "#F8F9FA",
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: "#E5E5EA"
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#000" }}>
                    {discount.min}-{discount.max} people: {discount.percent}%
                    off
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeDiscount(index)}
                    style={{ padding: 4 }}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color="#FF5A5F"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {!showAddForm ? (
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderWidth: 2,
                borderColor: "#E5E5EA",
                borderStyle: "dashed",
                borderRadius: 12,
                backgroundColor: "#F8F9FA"
              }}
            >
              <MaterialCommunityIcons
                name="plus-circle"
                size={24}
                color="#8E8E93"
              />
              <Text style={{ marginLeft: 12, fontSize: 16, color: "#8E8E93" }}>
                Add group discount
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E5EA",
                borderRadius: 12,
                padding: 16,
                backgroundColor: "#F8F9FA"
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 16,
                  color: "#000"
                }}
              >
                Add new discount
              </Text>

              <View style={{ flexDirection: "row", marginBottom: 12 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{ fontSize: 14, color: "#8E8E93", marginBottom: 8 }}
                  >
                    Min people
                  </Text>
                  <NumberField
                    label=""
                    value={newMin}
                    setValue={setNewMin}
                    min={2}
                    max={20}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text
                    style={{ fontSize: 14, color: "#8E8E93", marginBottom: 8 }}
                  >
                    Max people
                  </Text>
                  <NumberField
                    label=""
                    value={newMax}
                    setValue={setNewMax}
                    min={newMin}
                    max={30}
                  />
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, color: "#8E8E93", marginBottom: 8 }}
                >
                  Discount percentage
                </Text>
                <NumberField
                  label=""
                  value={newPercent}
                  setValue={setNewPercent}
                  min={5}
                  max={50}
                  step={5}
                />
              </View>

              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                  onPress={() => setShowAddForm(false)}
                  style={{
                    flex: 1,
                    padding: 12,
                    backgroundColor: "#F2F2F7",
                    borderRadius: 8,
                    marginRight: 8,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#8E8E93", fontWeight: "600" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addDiscount}
                  style={{
                    flex: 1,
                    padding: 12,
                    backgroundColor: "#FF385C",
                    borderRadius: 8,
                    marginLeft: 8,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "600" }}>
                    Add Discount
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={() => {
            updateExperienceData({ GroupDiscounts: JSON.stringify(discounts) });
            onNext();
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Step 17: Arrival time (minutes early)
const ArrivalTimeReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [mins, setMins] = useState(experienceData.ArrivalTime || 15);
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arrival time</Text>
          <Text style={styles.sectionDescription}>
            How many minutes before start should guests arrive?
          </Text>
          <View style={{ flexDirection: "row" }}>
            <NumberField
              label="Minutes early"
              value={mins}
              setValue={setMins}
              min={0}
              max={180}
              step={5}
              unit=" min"
            />
          </View>
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={() => {
            updateExperienceData({ ArrivalTime: mins });
            onNext();
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Step 18: Cancellation policy
const CancellationPolicyReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [policy, setPolicy] = useState(
    experienceData.CancellationPolicy || "flexible"
  );
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancellation policy</Text>
          <Text style={styles.sectionDescription}>
            Choose your cancellation terms.
          </Text>
          {CANCELLATION_POLICIES.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setPolicy(opt.value)}
              style={{
                padding: 12,
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: policy === opt.value ? "#FF385C" : "#E5E5EA",
                backgroundColor: policy === opt.value ? "#FFF5F5" : "#F8F9FA"
              }}
            >
              <Text style={{ fontWeight: "600", color: "#000" }}>
                {opt.label}
              </Text>
              <Text style={{ color: "#8E8E93" }}>{opt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={() => {
            updateExperienceData({ CancellationPolicy: policy });
            onNext();
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Step 19: Video demo (optional)
const VideoDemoReal: React.FC<StepProps> = ({
  experienceData,
  updateExperienceData,
  onNext,
  onPrevious
}) => {
  const [videoURL, setVideoURL] = useState(experienceData.VideoURL || "");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickVideo = async () => {
    // Use native picker - no permissions needed
    const res = await pickVideoNative({
      quality: 0.8,
      allowsEditing: true,
      videoMaxDuration: 60 // 1 minute max
    });

    if (res.canceled || !res.assets || res.assets.length === 0) return;

    const asset = res.assets[0];
    setUploading(true);
    setUploadProgress(0);

    const data = new FormData();
    data.append("file", {
      uri: asset.uri,
      name: "video.mp4",
      type: "video/mp4"
    } as any);
    data.append("upload_preset", cloudinary.uploadPreset);

    try {
      const upload = await axios.post(cloudinary.uploadUrl("video"), data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(progress);
        }
      });

      const url = upload.data.secure_url as string;
      setVideoURL(url);
      Alert.alert("Success", "Video uploaded successfully!");
    } catch (e) {
      Alert.alert("Upload failed", "Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Video demonstration (optional)
          </Text>
          <Text style={styles.sectionDescription}>
            Upload a short video (max 1 minute) to show guests what to expect
            from your experience.
          </Text>

          {videoURL ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E5EA",
                borderRadius: 12,
                padding: 16,
                backgroundColor: "#F8F9FA",
                marginBottom: 16
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="video"
                    size={24}
                    color="#FF385C"
                  />
                  <Text style={{ marginLeft: 12, fontSize: 16, color: "#000" }}>
                    Video uploaded
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setVideoURL("")}
                  style={{ padding: 4 }}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color="#FF5A5F"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickVideo}
              disabled={uploading}
              style={{
                borderWidth: 2,
                borderColor: uploading ? "#C7C7CC" : "#E5E5EA",
                borderStyle: "dashed",
                borderRadius: 12,
                padding: 24,
                backgroundColor: uploading ? "#F2F2F7" : "#F8F9FA",
                alignItems: "center",
                marginBottom: 16
              }}
            >
              {uploading ? (
                <View style={{ alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="upload"
                    size={32}
                    color="#8E8E93"
                  />
                  <Text
                    style={{ marginTop: 8, fontSize: 16, color: "#8E8E93" }}
                  >
                    Uploading... {uploadProgress}%
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="video-plus"
                    size={32}
                    color="#8E8E93"
                  />
                  <Text
                    style={{ marginTop: 8, fontSize: 16, color: "#8E8E93" }}
                  >
                    Upload video
                  </Text>
                  <Text
                    style={{ marginTop: 4, fontSize: 14, color: "#8E8E93" }}
                  >
                    Max 1 minute
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <View
            style={{
              padding: 12,
              backgroundColor: "#FFF5F5",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#FFE5E5"
            }}
          >
            <Text style={{ fontSize: 14, color: "#8E8E93" }}>
              💡 Tip: Keep your video under 1 minute and show the key highlights
              of your experience
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={() => {
            updateExperienceData({ VideoURL: videoURL.trim() });
            onNext();
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Step 20: Identity verification notice
const IdentityVerificationReal: React.FC<StepProps> = ({
  user,
  onNext,
  onPrevious
}) => {
  const isVerified = user?.isVerified || user?.IsVerified || false;
  const verificationStatus = user?.verificationStatus || "pending";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "#00C851";
      case "pending":
        return "#FF9500";
      case "rejected":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "pending":
        return "Under Review";
      case "rejected":
        return "Needs Attention";
      default:
        return "Not Started";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return "check-circle";
      case "pending":
        return "clock";
      case "rejected":
        return "alert-circle";
      default:
        return "help-circle";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity verification</Text>
          <Text style={styles.sectionDescription}>
            For security and trust, all hosts must verify their identity before
            experiences can go live.
          </Text>

          <View
            style={{
              borderWidth: 2,
              borderColor: getStatusColor(verificationStatus),
              borderRadius: 16,
              padding: 20,
              backgroundColor: isVerified ? "#F0FFF4" : "#FFF8F0",
              marginBottom: 20
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12
              }}
            >
              <MaterialCommunityIcons
                name={getStatusIcon(verificationStatus) as any}
                size={28}
                color={getStatusColor(verificationStatus)}
              />
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 18,
                  fontWeight: "700",
                  color: getStatusColor(verificationStatus)
                }}
              >
                {getStatusText(verificationStatus)}
              </Text>
            </View>

            {isVerified ? (
              <Text style={{ fontSize: 16, color: "#2D5A27", lineHeight: 22 }}>
                ✅ Your identity has been verified. You can now submit
                experiences for review.
              </Text>
            ) : verificationStatus === "pending" ? (
              <Text style={{ fontSize: 16, color: "#B8860B", lineHeight: 22 }}>
                ⏳ Your verification is under review. We'll notify you within 24
                hours.
              </Text>
            ) : verificationStatus === "rejected" ? (
              <Text style={{ fontSize: 16, color: "#CC0000", lineHeight: 22 }}>
                ❌ Your verification was rejected. Please check your documents
                and try again.
              </Text>
            ) : (
              <Text style={{ fontSize: 16, color: "#8E8E93", lineHeight: 22 }}>
                📋 Complete your identity verification to start hosting
                experiences.
              </Text>
            )}
          </View>

          {!isVerified && (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E5EA",
                borderRadius: 12,
                padding: 16,
                backgroundColor: "#F8F9FA"
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 12,
                  color: "#000"
                }}
              >
                Required documents:
              </Text>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: "#8E8E93" }}>
                  • Government-issued ID (passport, driver's license)
                </Text>
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: "#8E8E93" }}>
                  • Selfie holding your ID
                </Text>
              </View>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: "#8E8E93" }}>
                  • Proof of address (utility bill, bank statement)
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: "#FF385C",
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  alignItems: "center"
                }}
              >
                <Text
                  style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}
                >
                  Start Verification
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View
            style={{
              padding: 16,
              backgroundColor: "#E3F2FD",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#BBDEFB"
            }}
          >
            <Text style={{ fontSize: 14, color: "#1976D2", lineHeight: 20 }}>
              🔒 Your personal information is encrypted and secure. We only use
              it for verification purposes.
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={onNext}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Step 21: Review & submit (calls backend submit endpoint later)
const ReviewSubmitReal: React.FC<StepProps> = ({
  experienceData,
  user,
  onPrevious,
  onNext,
  navigation
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Prepare the experience data for submission
      const submitData = {
        title: experienceData.Title || "",
        city: experienceData.City || "",
        language: experienceData.Language || "",
        focus: experienceData.Focus || "",
        hasHostedBefore: experienceData.HasHostedBefore || false,
        hostedFor: experienceData.HostedFor || "",
        description: experienceData.Description || "",
        whatWeDo: experienceData.WhatWeDo || "",
        duration: experienceData.Duration || 0,
        whatToBring: experienceData.WhatToBring || "",
        bringRequired: experienceData.BringRequired || false,
        minAge: experienceData.MinAge || 0,
        maxAge: experienceData.MaxAge || 0,
        activityLevel: experienceData.ActivityLevel || "",
        difficultyLevel: experienceData.DifficultyLevel || "",
        groupSize: experienceData.GroupSize || 0,
        startTime: experienceData.StartTime || "",
        endTime: experienceData.EndTime || "",
        pricePerPerson: experienceData.PricePerPerson || 0,
        groupDiscounts: experienceData.GroupDiscounts || JSON.stringify([]),
        arrivalTime: experienceData.ArrivalTime || 0,
        cancellationPolicy: experienceData.CancellationPolicy || "",
        videoURL: experienceData.VideoURL || ""
      };

      // Validate required fields
      if (
        !submitData.title ||
        !submitData.city ||
        !submitData.language ||
        !submitData.focus
      ) {
        Alert.alert(
          "Missing Required Fields",
          "Please complete all required fields before submitting."
        );
        setSubmitting(false);
        return;
      }

      // Remove empty strings and use null for optional fields
      const cleanSubmitData = {
        title: submitData.title,
        city: submitData.city,
        language: submitData.language,
        focus: submitData.focus,
        hasHostedBefore: submitData.hasHostedBefore,
        hostedFor: submitData.hostedFor || null,
        description: submitData.description || null,
        whatWeDo: submitData.whatWeDo || null,
        duration: submitData.duration || 0,
        whatToBring: submitData.whatToBring || null,
        bringRequired: submitData.bringRequired,
        minAge: submitData.minAge || 0,
        maxAge: submitData.maxAge || 0,
        activityLevel: submitData.activityLevel || null,
        difficultyLevel: submitData.difficultyLevel || null,
        groupSize: submitData.groupSize || 0,
        startTime: submitData.startTime || null,
        endTime: submitData.endTime || null,
        pricePerPerson: submitData.pricePerPerson || 0,
        groupDiscounts: submitData.groupDiscounts || null,
        arrivalTime: submitData.arrivalTime || 0,
        cancellationPolicy: submitData.cancellationPolicy || null,
        videoURL: submitData.videoURL || null,
        photos: JSON.stringify((experienceData as any).photos || [])
      };

      console.log("Submitting experience data:", cleanSubmitData);
      console.log("Endpoint URL:", experienceEndpoints.create);

      // Call the backend API to create the experience
      if (!user?.accessToken) {
        Alert.alert("Authentication Error", "Please log in again to continue.");
        setSubmitting(false);
        return;
      }

      const response = await axios.post(
        experienceEndpoints.create,
        cleanSubmitData,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("Experience created response:", response.data);
      console.log("Response status:", response.status);

      if (!response.data.success) {
        throw new Error(
          "Experience creation failed: " + JSON.stringify(response.data)
        );
      }

      const experience = response.data.experience;
      if (!experience || !experience.id) {
        console.error("Invalid experience response:", response.data);
        throw new Error("Experience creation returned invalid data");
      }

      console.log("Experience ID:", experience.id);
      console.log(
        "Photos stored in experience:",
        (experienceData as any).photos
      );

      // Submit for review
      console.log("Submitting for review:", experience.id);
      await axios.post(
        experienceEndpoints.submit(experience.id),
        {},
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Show custom success modal with haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Experience submission error:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);

        // Check if it's a validation error
        if (error.response.data && error.response.data.validationErrors) {
          console.error(
            "Validation errors:",
            error.response.data.validationErrors
          );
          Alert.alert(
            "Validation Error",
            `Please check your input: ${JSON.stringify(
              error.response.data.validationErrors
            )}`
          );
        } else {
          Alert.alert(
            "Error",
            `Failed to submit experience: ${
              error.response.data?.error ||
              error.response.data?.message ||
              "Unknown error"
            }`
          );
        }
      } else {
        Alert.alert("Error", `Network error: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const formatPrice = (price: number) => `${price} MRU`;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review your experience</Text>
          <Text style={styles.sectionDescription}>
            Please review all details before submitting. You can edit any
            section by going back.
          </Text>

          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E5EA",
              borderRadius: 16,
              padding: 20,
              backgroundColor: "#F8F9FA",
              marginBottom: 20
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 16,
                color: "#000"
              }}
            >
              Experience Summary
            </Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: "#8E8E93", marginBottom: 4 }}>
                Title
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#000" }}>
                {experienceData.Title || "Not set"}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: "#8E8E93", marginBottom: 4 }}>
                Location & Language
              </Text>
              <Text style={{ fontSize: 16, color: "#000" }}>
                {experienceData.City || "Not set"},{" "}
                {experienceData.Language || "Not set"}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: "#8E8E93", marginBottom: 4 }}>
                Focus & Duration
              </Text>
              <Text style={{ fontSize: 16, color: "#000" }}>
                {experienceData.Focus || "Not set"} •{" "}
                {formatDuration(experienceData.Duration || 0)}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: "#8E8E93", marginBottom: 4 }}>
                Group Size & Timing
              </Text>
              <Text style={{ fontSize: 16, color: "#000" }}>
                Up to {experienceData.GroupSize || "Not set"} people •{" "}
                {experienceData.StartTime || "Not set"} -{" "}
                {experienceData.EndTime || "Not set"}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: "#8E8E93", marginBottom: 4 }}>
                Price
              </Text>
              <Text style={{ fontSize: 16, color: "#000" }}>
                {formatPrice(experienceData.PricePerPerson || 0)} per person
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: "#8E8E93", marginBottom: 4 }}>
                Activity Level
              </Text>
              <Text style={{ fontSize: 16, color: "#000" }}>
                {experienceData.ActivityLevel || "Not set"} •{" "}
                {experienceData.DifficultyLevel || "Not set"}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: "#8E8E93", marginBottom: 4 }}>
                Age Range
              </Text>
              <Text style={{ fontSize: 16, color: "#000" }}>
                {experienceData.MinAge || 0}+ years
                {experienceData.MaxAge && experienceData.MaxAge < 100
                  ? ` - ${experienceData.MaxAge} years`
                  : ""}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: "#8E8E93", marginBottom: 4 }}>
                Cancellation Policy
              </Text>
              <Text style={{ fontSize: 16, color: "#000" }}>
                {experienceData.CancellationPolicy || "Not set"}
              </Text>
            </View>

            {experienceData.WhatToBring && experienceData.BringRequired && (
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{ fontSize: 14, color: "#8E8E93", marginBottom: 4 }}
                >
                  What to Bring
                </Text>
                <Text style={{ fontSize: 16, color: "#000" }}>
                  {experienceData.WhatToBring}
                </Text>
              </View>
            )}

            {experienceData.VideoURL && (
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{ fontSize: 14, color: "#8E8E93", marginBottom: 4 }}
                >
                  Video Demo
                </Text>
                <Text style={{ fontSize: 16, color: "#000" }}>
                  ✅ Video uploaded
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E5EA",
              borderRadius: 12,
              padding: 16,
              backgroundColor: "#FFF8F0",
              marginBottom: 20
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8
              }}
            >
              <MaterialCommunityIcons
                name="information"
                size={20}
                color="#FF9500"
              />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#FF9500"
                }}
              >
                What happens next?
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#8E8E93", lineHeight: 20 }}>
              • Your experience will be reviewed by our team within 5 hours
              {"\n"}• We'll check all details and may request changes{"\n"}•
              Once approved, you can make it live and start accepting bookings
              {"\n"}• You'll receive email notifications throughout the process
            </Text>
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E5EA",
              borderRadius: 12,
              padding: 16,
              backgroundColor: "#F0FFF4"
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8
              }}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={20}
                color="#00C851"
              />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#00C851"
                }}
              >
                Security & Trust
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#2D5A27", lineHeight: 20 }}>
              Your experience details are secure and will only be shared with
              guests after approval. We maintain high standards to ensure guest
              safety and satisfaction.
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={onPrevious}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8E93" />
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            submitting && { backgroundColor: "#C7C7CC" }
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text
            style={[styles.nextButtonText, submitting && { color: "#8E8E93" }]}
          >
            {submitting ? "Submitting..." : "Submit for Review"}
          </Text>
          {!submitting && (
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={modalOverlay}>
          <View style={modalContainer}>
            {/* Success Icon */}
            <View style={iconContainer}>
              <MaterialCommunityIcons
                name="check-circle"
                size={60}
                color="#00A699"
              />
            </View>

            {/* Success Message */}
            <Text style={modalTitle}>Experience Submitted!</Text>
            <Text style={modalSubtitle}>
              Your experience has been submitted for review. We'll contact you
              within 5 hours.
            </Text>

            {/* Experience Info */}
            <View style={experienceInfo}>
              <Text style={experienceTitle}>{experienceData.Title}</Text>
              <Text style={experienceLocation}>{experienceData.City}</Text>
              <Text style={experiencePrice}>
                {experienceData.PricePerPerson} MRU per person
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                // Navigate to dashboard if navigation is available
                if (navigation) {
                  navigation.navigate("HostDashboard");
                } else {
                  onNext();
                }
              }}
            >
              <Text style={modalButtonText}>Continue to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
