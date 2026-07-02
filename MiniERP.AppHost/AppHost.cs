var builder = DistributedApplication.CreateBuilder(args);

// SQL Server database (runs in a container, needs Docker/Podman).
// A named data volume keeps the database contents across restarts. To reset the
// database from scratch (schema is owned by EF Core migrations), stop the app and
// run: docker volume rm minierp-sqldata
var sql = builder.AddSqlServer("sql")
    .WithDataVolume("minierp-sqldata");

var database = sql.AddDatabase("minierpdb");

// The existing MiniERP API, wired to the SQL database.
var api = builder.AddProject<Projects.MiniERP>("api")
    .WithReference(database)
    .WaitFor(database);

// The React (Vite) frontend, which talks to the API.
builder.AddNpmApp("web", "../MiniERP.Web", "dev")
    .WithReference(api)
    .WaitFor(api)
    .WithEnvironment("VITE_API_URL", api.GetEndpoint("http"))
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .PublishAsDockerFile();

builder.Build().Run();
