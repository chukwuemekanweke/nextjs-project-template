interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityIdConfiguration {
  callback: (response: GoogleCredentialResponse) => void;
  client_id: string;
  nonce: string;
}

interface GoogleIdentityButtonConfiguration {
  shape?: "rectangular" | "pill" | "circle" | "square";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  theme?: "outline" | "filled_blue" | "filled_black";
  type?: "standard" | "icon";
  width?: number;
}

interface Window {
  google?: {
    accounts: {
      id: {
        cancel(): void;
        initialize(configuration: GoogleIdentityIdConfiguration): void;
        renderButton(
          parent: HTMLElement,
          configuration: GoogleIdentityButtonConfiguration,
        ): void;
      };
    };
  };
}
