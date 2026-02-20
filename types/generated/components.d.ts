import type { Schema, Struct } from '@strapi/strapi';

export interface AboutTeamMember extends Struct.ComponentSchema {
  collectionName: 'components_about_team_member';
  info: {
    description: "Membre de l'\u00E9quipe";
    displayName: 'Team Member';
    icon: 'user';
  };
  attributes: {
    bio: Schema.Attribute.Text;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    photo: Schema.Attribute.Media<'images'>;
    role: Schema.Attribute.String;
  };
}

export interface AboutValueCard extends Struct.ComponentSchema {
  collectionName: 'components_about_value_card';
  info: {
    description: 'Carte valeur/principe';
    displayName: 'Value Card';
    icon: 'star';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AssessmentDimension extends Struct.ComponentSchema {
  collectionName: 'components_assessment_dimension';
  info: {
    description: "Dimension d'\u00E9valuation";
    displayName: 'Assessment Dimension';
    icon: 'chartBubble';
  };
  attributes: {
    description: Schema.Attribute.Text;
    dimensionId: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    weight: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>;
  };
}

export interface AssessmentQuestion extends Struct.ComponentSchema {
  collectionName: 'components_assessment_question';
  info: {
    description: "Question d'\u00E9valuation";
    displayName: 'Assessment Question';
    icon: 'question';
  };
  attributes: {
    dimension: Schema.Attribute.String & Schema.Attribute.Required;
    isRequired: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    order: Schema.Attribute.Integer & Schema.Attribute.Required;
    questionId: Schema.Attribute.String & Schema.Attribute.Required;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<['likert_5', 'likert_7', 'yes_no', 'numeric', 'text']> &
      Schema.Attribute.Required;
  };
}

export interface GoalMilestone extends Struct.ComponentSchema {
  collectionName: 'components_goal_milestone';
  info: {
    description: "Jalon d'objectif";
    displayName: 'Milestone';
    icon: 'check';
  };
  attributes: {
    completedAt: Schema.Attribute.DateTime;
    isCompleted: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    note: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LocationAddress extends Struct.ComponentSchema {
  collectionName: 'components_location_address';
  info: {
    description: 'Adresse postale';
    displayName: 'Address';
    icon: 'pinMap';
  };
  attributes: {
    city: Schema.Attribute.String & Schema.Attribute.Required;
    country: Schema.Attribute.String & Schema.Attribute.DefaultTo<'France'>;
    department: Schema.Attribute.String;
    postalCode: Schema.Attribute.String;
    region: Schema.Attribute.String;
    street: Schema.Attribute.String;
  };
}

export interface LocationCoordinates extends Struct.ComponentSchema {
  collectionName: 'components_location_coordinates';
  info: {
    description: 'Coordonn\u00E9es GPS';
    displayName: 'Coordinates';
    icon: 'globe';
  };
  attributes: {
    latitude: Schema.Attribute.Decimal & Schema.Attribute.Required;
    longitude: Schema.Attribute.Decimal & Schema.Attribute.Required;
  };
}

export interface ScheduleOpeningSlot extends Struct.ComponentSchema {
  collectionName: 'components_schedule_opening_slot';
  info: {
    description: "Cr\u00E9neau d'ouverture";
    displayName: 'Opening Slot';
    icon: 'clock';
  };
  attributes: {
    closeTime: Schema.Attribute.Time & Schema.Attribute.Required;
    dayOfWeek: Schema.Attribute.Enumeration<
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    > &
      Schema.Attribute.Required;
    note: Schema.Attribute.String;
    openTime: Schema.Attribute.Time & Schema.Attribute.Required;
  };
}

export interface SharedSeoMeta extends Struct.ComponentSchema {
  collectionName: 'components_shared_seo_meta';
  info: {
    description: 'M\u00E9tadonn\u00E9es SEO';
    displayName: 'SEO Meta';
    icon: 'search';
  };
  attributes: {
    canonicalUrl: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

export interface TutorialStep extends Struct.ComponentSchema {
  collectionName: 'components_tutorial_step';
  info: {
    description: '\u00C9tape de tutoriel';
    displayName: 'Tutorial Step';
    icon: 'bulletList';
  };
  attributes: {
    content: Schema.Attribute.RichText & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    order: Schema.Attribute.Integer & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'about.team-member': AboutTeamMember;
      'about.value-card': AboutValueCard;
      'assessment.dimension': AssessmentDimension;
      'assessment.question': AssessmentQuestion;
      'goal.milestone': GoalMilestone;
      'location.address': LocationAddress;
      'location.coordinates': LocationCoordinates;
      'schedule.opening-slot': ScheduleOpeningSlot;
      'shared.seo-meta': SharedSeoMeta;
      'tutorial.step': TutorialStep;
    }
  }
}
