export type ApplicationStatus =
    | 'bookmarked'
    | 'invited'
    | 'applied'
    | 'interviewing'
    | 'shortlisted'
    | 'hired';

export interface Contact {
    addressCountry: string;
    firstName: string;
    lastName: string;
    addressZip: string;
    companyName: string;
    addressState: string;
    addressCity: string;
}

export interface ClientDataProfile {
    photoUrl: string;
    industry: string;
    companyAge: number;
    companyHeadcount: number;
}

export interface ClientData {
    profile: ClientDataProfile;
    onboardingComplete: boolean;
}

export interface Client {
    id: string;
    accountType: string;
    contact: Contact;
    clientData: ClientData;
    matchScore?: number;
    deleted?: boolean;
    suspended?: boolean;
}

export interface Application {
    applicationStatus: ApplicationStatus;
    applicationRating?: -1 | 0 | 1;
    dateCreated: number;
    talent: string | Talent;
    dateUpdated: number;
    applicationMessage?: string;
}

export interface Requirements {
    technologies: string[];
    leadTypes: string[];
    education: string[];
    salesRoles: string[];
    yearsOfExperience: string;
    industries: string[];
    salesCycles: string[];
    salesTypes: string[];
    decisionMakers: string[];
    dealAmounts: string[];
    salesEnvironments: string[];
    salesVolumes: string[];
}

export interface Details {
    benefits: string[];
    commitment: string;
    minimumCompensation: number;
    salesRole: string;
    compensationType: string;
}

export interface Listing {
    dateCreated: number;
    requirements: Requirements;
    client: Client;
    applications: Application[];
    details?: Details;
    description: string;
    id: string;
    dateUpdated: number;
    title: string;
    instructions?: string;
    calendarLink?: string;
    matchScore?: number;
}

export type TalentContact = Omit<Contact, 'companyName'>;

export interface TalentProfile {
    about: string;
    photoUrl: string;
    videoUrl: string;
    headline: string;
}

export interface TalentData {
    bookmarkedListings: string[];
    experience: Record<string, any>;
    files: Record<string, any>;
    goals: Record<string, any>;
    onboardingComplete: boolean;
    profile: TalentProfile;
}

export interface Talent {
    id: string;
    accountType: string;
    contact: TalentContact;
    talentData: TalentData;
    matchScore?: number;
    deleted?: boolean;
    suspended?: boolean;
}

export interface TalentApplication extends Application {
    listing: Listing;
    client: Client;
}
