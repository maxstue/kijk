using Riok.Mapperly.Abstractions;

// Every response member must be mapped, so a new response property fails the build until it is mapped or ignored.
[assembly: MapperDefaults(RequiredMappingStrategy = RequiredMappingStrategy.Target)]